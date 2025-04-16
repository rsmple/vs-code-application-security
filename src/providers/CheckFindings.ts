import {window, workspace} from 'vscode'

import WorkspaceState from '@/utils/WorkspaceState'

import {existsSync, readFileSync} from 'fs'
import {join} from 'path'

import AssetApi from '@/api/modules/AssetApi'
import FindingApi from '@/api/modules/FindingApi'
import {AssetType} from '@/models/Asset'
import {TriageStatus} from '@/models/TriageStatus'
import {outputChannel} from '@/utils/OutputChannel'

import {applyDecorationsFinding} from './DecorationsFinding'
import {setLoading, setMessage, stopLoading, treeDataProviderFinding} from './TreeDataProviderFinding'

const repositoryUrlRegex = /url\s*=\s*(.+)/

export const showErrorMessage = (text: string) => {
  window.showErrorMessage(text)

  setMessage(text)
}

const updateRepositoryUrl = (): string | undefined => {
  if (!workspace.workspaceFolders || workspace.workspaceFolders.length === 0) {
    showErrorMessage('No opened workspace folders.')
    return
  }

  const gitConfigPath = join(workspace.workspaceFolders[0].uri.fsPath, '.git', 'config')

  if (!existsSync(gitConfigPath)) {
    showErrorMessage('.git/config is not found on project root')
    return
  }

  const gitConfigContent = readFileSync(gitConfigPath, 'utf8')
  const repoUrlMatch = gitConfigContent.match(repositoryUrlRegex)

  if (!repoUrlMatch) {
    showErrorMessage('Failed to extract repository URL from .git/config')
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

  const count = response.data.results.length

  if (!response.data.results || count === 0) {
    WorkspaceState.asset = undefined
    WorkspaceState.findingList = []

    outputChannel.appendLine('No assets for repository')
    showErrorMessage(`Repository ${ repositoryUrl } is not found in portal`)
    return
  }

  outputChannel.appendLine(`Found ${ count } asset${ count === 1 ? '' : 's' } for repository ${ repositoryUrl }`)

  let selectedAsset = response.data.results[0]
  for (const asset of response.data.results) {
    if ((asset.verified_and_assigned_findings_count ?? 0) > (selectedAsset.verified_and_assigned_findings_count ?? 0)) {
      selectedAsset = asset
    }
  }

  if (!selectedAsset.verified_and_assigned_findings_count) {
    showErrorMessage(`No verified findings for repository ${ repositoryUrl }`)
    return
  }

  outputChannel.appendLine(`Use product ID: ${ selectedAsset.product }`)

  WorkspaceState.asset = selectedAsset
}

const getFindings = async (repositoryUrl: string, page = 1) => {
  const response = await FindingApi.getList({
    triage_status: TriageStatus.VERIFIED,
    assets__in: {0: [repositoryUrl]},
    page,
    ordering: '-severity',
  })

  if (page === 1 && !response.data.results) {
    showErrorMessage(`No findings to show for repository ${ repositoryUrl }`)
    return
  }

  const message = `Findings: ${ response.data.count }`
  outputChannel.appendLine(message)

  if (page === 1) WorkspaceState.findingList = response.data.results
  else WorkspaceState.findingList.push(...response.data.results)

  applyDecorationsFinding()
  treeDataProviderFinding.updateList()

  if (response.data.pages_count > page) {
    await getFindings(repositoryUrl, page + 1)
  }
}

const updateFindingList = async () => {
  const repositoryUrl = WorkspaceState.repositoryUrl
  const asset = WorkspaceState.asset

  if (!repositoryUrl || !asset) return

  outputChannel.appendLine('Requesting findings...')

  await getFindings(repositoryUrl)

  outputChannel.appendLine('Vulnerability checking completed')
}

const doUpdate = async () => {
  outputChannel.appendLine('Start vulnerability checking')

  setLoading()

  updateRepositoryUrl()

  await updateAsset()

  await updateFindingList()

  stopLoading()
}

export const checkFindings = async () => {
  return await doUpdate().catch(error => {
    window.showErrorMessage(`Error:\n${ JSON.stringify(error, null, 2) }`)
  })
}
