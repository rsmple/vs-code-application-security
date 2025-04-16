import {type DecorationOptions, window, workspace} from 'vscode'

import {getFindingHoverMessage} from '@/models/Finding'
import {getSettings} from '@/models/Settings'
import {Severity, severityDecorationMap, severityList} from '@/models/Severity'

import {treeDataProviderFinding} from './TreeDataProviderFinding'

const resetDecorations = () => {
  const editor = window.activeTextEditor
  if (!editor) return

  severityList.forEach(severity => {
    editor.setDecorations(severityDecorationMap[severity], [])
  })
}

export const applyDecorationsFinding = () => {
  const editor = window.activeTextEditor

  if (!editor) return

  const findingList = treeDataProviderFinding.groupList[workspace.asRelativePath(editor.document.uri, false)]

  const settings = getSettings()

  if (!settings.personalization.highlight || !findingList?.length) {
    resetDecorations()

    return
  }

  const decorationsBySeverity: Record<Severity, DecorationOptions[]> = {
    [Severity.INFO]: [],
    [Severity.LOW]: [],
    [Severity.MEDIUM]: [],
    [Severity.HIGH]: [],
    [Severity.CRITICAL]: [],
  }

  findingList.forEach(item => {
    if (item.line === null) return

    const range = editor.document.lineAt(item.line - 1).range

    decorationsBySeverity[item.severity].push({
      range,
      hoverMessage: getFindingHoverMessage(item),
    })
  })

  severityList.forEach(severity => {
    editor.setDecorations(severityDecorationMap[severity], decorationsBySeverity[severity])
  })
}
