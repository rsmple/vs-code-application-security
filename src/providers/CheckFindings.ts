import {window, workspace} from 'vscode'

import WorkspaceState from '@/utils/WorkspaceState'

import {existsSync, readFileSync} from 'fs'
import {join} from 'path'

import {applyDecorationsFinding} from './DecorationsFinding'
import {treeDataProviderFinding} from './TreeDataProviderFinding'

import AssetApi from '@/api/modules/AssetApi'
import FindingApi from '@/api/modules/FindingApi'
import {AssetType} from '@/models/Asset'
import {TriageStatus} from '@/models/TriageStatus'
import {outputChannel} from '@/utils/OutputChannel'

const repositoryUrlRegex = /url\s*=\s*(.+)/

const updateRepositoryUrl = (): string | undefined => {
  if (!workspace.workspaceFolders || workspace.workspaceFolders.length === 0) {
    window.showErrorMessage('No opened workspace folders.')
    return
  }

  const gitConfigPath = join(workspace.workspaceFolders[0].uri.fsPath, '.git', 'config')

  if (!existsSync(gitConfigPath)) {
    window.showErrorMessage('.git/config is not found on project root')
    return
  }

  const gitConfigContent = readFileSync(gitConfigPath, 'utf8')
  const repoUrlMatch = gitConfigContent.match(repositoryUrlRegex)

  if (!repoUrlMatch) {
    window.showErrorMessage('Failed to extract repository URL from .git/config')
    return
  }

  const repositoryUrl = repoUrlMatch[1].trim()

  outputChannel.appendLine(`Fount repository URL: ${ repositoryUrl }`)

  WorkspaceState.repositoryUrl = repositoryUrl
}

const updateAsset = async () => {
  const repositoryUrl = WorkspaceState.repositoryUrl

  if (!repositoryUrl) return

  outputChannel.appendLine('Requesting repository from portal...')
  const response = await AssetApi.getList({asset_type: AssetType.REPOSITORY, search: repositoryUrl})

  if (!response.data.results || response.data.results.length === 0) {
    window.showInformationMessage('Repository is not found in portal')
    return
  }

  outputChannel.appendLine(`Found ${ response.data.results.length } asset for repo`)

  let selectedAsset = response.data.results[0]
  for (const asset of response.data.results) {
    if ((asset.verified_and_assigned_findings_count ?? 0) > (selectedAsset.verified_and_assigned_findings_count ?? 0)) {
      selectedAsset = asset
    }
  }

  if (!selectedAsset.verified_and_assigned_findings_count) {
    window.showInformationMessage('No verified findings.')
    return
  }

  outputChannel.appendLine(`Use product ID: ${ selectedAsset.product }`)

  WorkspaceState.asset = selectedAsset
}

const updateFindingList = async () => {
  const repositoryUrl = WorkspaceState.repositoryUrl
  const asset = WorkspaceState.asset

  if (!repositoryUrl || !asset) return

  outputChannel.appendLine('Requesting findings...')

  const response = await FindingApi.getList({
    product: asset.product,
    triage_status: TriageStatus.VERIFIED,
    assets__in: {0: [repositoryUrl]},
    page: 1,
  })

  if (!response.data.results) {
    window.showInformationMessage('No findings.')
    return
  }

  outputChannel.appendLine(`Findings count: ${ response.data.count }`)

  WorkspaceState.findingList = response.data.results
}

const doUpdate = async () => {
  outputChannel.appendLine('Start vulnerability checking')

  updateRepositoryUrl()

  await updateAsset()

  outputChannel.appendLine('Requesting findings...')

  await updateFindingList()

  outputChannel.appendLine('ready')

  applyDecorationsFinding()
  treeDataProviderFinding.updateList()
}

export const checkFindings = async () => {
  return await doUpdate().catch(error => {
    window.showErrorMessage(`Ошибка: ${ JSON.stringify(error) }`)
    console.error(error)
  })
}
