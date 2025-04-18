import {type DecorationOptions, DecorationRangeBehavior, window, workspace} from 'vscode'

import {getFindingHoverMessage} from '@/models/Finding'
import {getSettings} from '@/models/Settings'
import {Severity, severityDecorationMap, severityList} from '@/models/Severity'
import {outputChannel} from '@/utils/OutputChannel'
import severityColors from '@/utils/severity'

import {treeDataProviderFinding} from './TreeDataProviderFinding'

const severityKeyMap: Record<Severity, keyof typeof severityColors> = {
  [Severity.INFO]: 'info',
  [Severity.LOW]: 'low',
  [Severity.MEDIUM]: 'medium',
  [Severity.HIGH]: 'high',
  [Severity.CRITICAL]: 'critical',
}

const changedLineDecorationMap = severityList.reduce<Record<Severity, ReturnType<typeof window.createTextEditorDecorationType>>>((result, current) => {
  result[current] = window.createTextEditorDecorationType({
    isWholeLine: false,
    before: {
      contentText: '●',
      color: severityColors[severityKeyMap[current]].text,
      margin: '0 -8px 0 0',
    },
    rangeBehavior: DecorationRangeBehavior.OpenClosed,
  })

  return result
}, {} as Record<Severity, ReturnType<typeof window.createTextEditorDecorationType>>)

const resetDecorations = () => {
  const editor = window.activeTextEditor
  if (!editor) return

  severityList.forEach(severity => {
    editor.setDecorations(severityDecorationMap[severity], [])
    editor.setDecorations(changedLineDecorationMap[severity], [])
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

  const changedDecorationsBySeverity: Record<Severity, DecorationOptions[]> = {
    [Severity.INFO]: [],
    [Severity.LOW]: [],
    [Severity.MEDIUM]: [],
    [Severity.HIGH]: [],
    [Severity.CRITICAL]: [],
  }

  findingList.forEach(item => {
    if (item.line === null) return

    const line = editor.document.lineAt(item.line - 1)

    if (line.text === item.line_text) {
      decorationsBySeverity[item.severity].push({
        range: line.range,
        hoverMessage: getFindingHoverMessage(item, false),
      })
    } else {
      changedDecorationsBySeverity[item.severity].push({
        range: line.range,
        hoverMessage: getFindingHoverMessage(item, true),
      })
    }
  })

  outputChannel.appendLine(`Applying finding decorations for file ${ path }`)

  severityList.forEach(severity => {
    editor.setDecorations(severityDecorationMap[severity], decorationsBySeverity[severity])
    editor.setDecorations(changedLineDecorationMap[severity], changedDecorationsBySeverity[severity])
  })
}