import {window, workspace} from 'vscode'

import WorkspaceState from '@/utils/WorkspaceState'

import AssetApi from '@/api/modules/AssetApi'
import FindingApi from '@/api/modules/FindingApi'
import {type Asset, AssetType, parseGitUrl} from '@/models/Asset'
import {getFindingAbsolutePath} from '@/models/Finding'
import {getSettings} from '@/models/Settings'
import {severityTitleEmojiMapReverse} from '@/models/Severity'
import {triageStatusTitleMapReverse} from '@/models/TriageStatus'
import {getGitRemoteUrl} from '@/utils/GitConfig'
import {outputChannel} from '@/utils/OutputChannel'

import {applyDecorationsFinding} from './DecorationsFinding'
import {setLoading, showErrorMessage, stopLoading, treeDataProviderFinding} from './TreeDataProviderFinding'

const updateRepositoryUrl = async () => {
  if (!workspace.workspaceFolders || workspace.workspaceFolders.length === 0) {
    showErrorMessage('No opened workspace folders.')
    return
  }

  const repositoryUrl = await getGitRemoteUrl(workspace.workspaceFolders[0].uri.fsPath)

  if (!repositoryUrl) {
    showErrorMessage('Failed to extract repository URL from .git/config')
    return
  }

  outputChannel.appendLine(`Found repository URL: ${ repositoryUrl }`)

  WorkspaceState.repositoryUrl = repositoryUrl
}

const updateAssetList = async () => {
  const repositoryUrl = WorkspaceState.repositoryUrl

  if (!repositoryUrl) return

  const parsed = parseGitUrl(repositoryUrl)

  if (!parsed) {
    const message = `Failed to parse repository URL: ${ repositoryUrl }`
    outputChannel.appendLine(message)
    showErrorMessage(message)

    return
  }

  outputChannel.appendLine('Requesting repository from portal...')
  const response = await AssetApi.getList({asset_type: AssetType.REPOSITORY, search: `${ parsed.domain } ${ parsed.path }`})

  const list = response.data.results.filter(item => {
    const domainIndex = item.value.indexOf(parsed.domain)
    const pathIndex = item.value.indexOf(parsed.path)

    if (domainIndex === -1 || pathIndex === -1) return false

    return item.value.substring(domainIndex + parsed.domain.length, pathIndex).length <= 1
  })

  if (list.length === 0) {
    WorkspaceState.assetList = []
    WorkspaceState.findingList = []

    outputChannel.appendLine('No assets for repository')
    showErrorMessage(`Repository ${ repositoryUrl } is not found in portal`)
    return
  }

  outputChannel.appendLine(`Found ${ list.length } asset${ list.length === 1 ? '' : 's' } for repository ${ repositoryUrl }`)

  list.forEach(item => {
    outputChannel.appendLine(item.value + (item.related_objects_meta?.product.name ? ` ( ${ item.related_objects_meta.product.name } | ${ item.related_objects_meta.product.related_objects_meta.product_type.name } )`: ''))
  })

  WorkspaceState.assetList = list
}

const getFindings = async (assetList: Asset[], page = 1) => {
  const settings = getSettings()

  const response = await FindingApi.getList({
    triage_status__in: settings.filter.triageStatuses
      .map(item => triageStatusTitleMapReverse[item])
      .filter(item => item),
    severity__in: settings.filter.severity
      .map(item => severityTitleEmojiMapReverse[item])
      .filter(item => item),
    assets__in: {
      [AssetType.REPOSITORY]: assetList
        .map(item => item.value)
        .filter((item, index, array) => array.indexOf(item) === index),
    },
    page,
    slice_indexes: page === 1 ? undefined : [0, settings.filter.maxFindings - 1],
    ordering: '-severity',
  })

  if (page === 1) {
    WorkspaceState.findingsCount = response.data.count

    treeDataProviderFinding.updateHeader()

    if (response.data.results.length === 0) {
      showErrorMessage(`No findings to show for repository ${ WorkspaceState.repositoryUrl }`)

      return
    }
  }

  const message = `Findings: ${ response.data.count }`
  outputChannel.appendLine(message)

  for (const finding of response.data.results) {
    if (finding.line === null) {
      finding.line_text = '[Line is not provided]'
      continue
    }

    const path = getFindingAbsolutePath(finding)

    if (!path) {
      finding.line_text = '[File path is not provided]'
      continue
    }

    try {
      const document = await workspace.openTextDocument(path)

      finding.language = document.languageId

      if (finding.line - 1 <= document.lineCount) {
        finding.line_text = document.lineAt(finding.line - 1).text
      } else {
        finding.line_text = '[Line out of range]'
      }
    } catch (err) {
      finding.line_text = '[File not found or unreadable]'
    }
  }

  if (page === 1) WorkspaceState.findingList = response.data.results
  else WorkspaceState.findingList.push(...response.data.results)

  treeDataProviderFinding.updateList()

  applyDecorationsFinding()

  if (response.data.pages_count > page) {
    await getFindings(assetList, page + 1)
  }
}

const updateFindingList = async () => {
  const assetList = WorkspaceState.assetList

  if (!assetList.length) return

  outputChannel.appendLine('Requesting findings...')

  await getFindings(assetList)

  outputChannel.appendLine('Vulnerability checking completed')
}

const doUpdate = async () => {
  outputChannel.appendLine('Start vulnerability checking')

  setLoading()

  await updateRepositoryUrl()

  await updateAssetList()

  await updateFindingList()

  stopLoading()
}

export const checkFindings = async () => {
  return await doUpdate()
    .catch(error => {
      window.showErrorMessage(`Error:\n${ JSON.stringify(error, null, 2) }`)
    })
}
