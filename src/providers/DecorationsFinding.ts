import {type DecorationOptions, window, workspace} from 'vscode'

import {getFindingHoverMessage} from '@/models/Finding'
import {getSettings} from '@/models/Settings'
import {Severity, severityDecorationMap, severityList} from '@/models/Severity'
import {outputChannel} from '@/utils/OutputChannel'

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

  const path = workspace.asRelativePath(editor.document.uri, false)

  const findingList = treeDataProviderFinding.groupList[path]

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

    const line = editor.document.lineAt(item.line - 1)

    if (line.text !== item.line_text) return

    decorationsBySeverity[item.severity].push({
      range: line.range,
      hoverMessage: getFindingHoverMessage(item),
    })
  })

  outputChannel.appendLine(`Applying finding decorations for file ${ path }`)

  severityList.forEach(severity => {
    editor.setDecorations(severityDecorationMap[severity], decorationsBySeverity[severity])
  })
}
