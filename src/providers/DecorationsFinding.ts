import {type DecorationOptions, DecorationRangeBehavior, window, workspace} from 'vscode'

import {getFindingHoverMessage} from '@/models/Finding'
import {getSettings} from '@/models/Settings'
import {Severity, severityList} from '@/models/Severity'
import {severityDecorationMap} from '@/models/SeverityDecoration'
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

  const lines = findingList.map(item => item.line).filter((item, index, array): item is number => array.indexOf(item) === index && item !== null)

  lines.forEach(line => {
    const findings = findingList
      .filter(item => item.line === line)
      .sort((a, b) => a.name > b.name ? 1 : a.name < b.name ? -1 : 0)
      .sort((a, b) => a.severity < b.severity ? 1 : a.severity > b.severity ? -1 : 0)

    if (!findings.length) return

    const finding = findings.splice(0, 1)[0]

    if (finding.line === null) return

    const lineAt = editor.document.lineAt(finding.line - 1)

    const outdated = lineAt.text !== finding.line_text

    const message = getFindingHoverMessage(finding, outdated, findings.length ? `(1 / ${ findings.length + 1 }) ` : undefined)

    findings.forEach((item, index) => {
      message.appendMarkdown('\n\n---\n\n')

      message.appendMarkdown(getFindingHoverMessage(item, lineAt.text !== item.line_text, `(${ index + 2 } / ${ findings.length + 1 }) `).value)
    })

    const target = outdated ? changedDecorationsBySeverity : decorationsBySeverity

    target[finding.severity].push({
      range: lineAt.range,
      hoverMessage: message,
    })
  })

  outputChannel.appendLine(`Applying finding decorations for file ${ path }`)

  severityList.forEach(severity => {
    editor.setDecorations(severityDecorationMap[severity], decorationsBySeverity[severity])
    editor.setDecorations(changedLineDecorationMap[severity], changedDecorationsBySeverity[severity])
  })
}