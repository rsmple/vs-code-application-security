import {type DecorationOptions, window} from 'vscode'

import WorkspaceState from '@/utils/WorkspaceState'

import {normalize} from 'path'

import {getFindingAbsolutePath, getFindingDetails} from '@/models/Finding'
import {getSettings} from '@/models/Settings'
import {Severity, severityDecorationMap, severityList} from '@/models/Severity'

export const applyDecorationsFinding = () => {
  const editor = window.activeTextEditor
  if (!editor) return

  const settings = getSettings()

  if (!settings.personalization.highlight) {
    severityList.forEach(severity => {
      editor.setDecorations(severityDecorationMap[severity], [])
    })

    return
  }

  const decorationsBySeverity: Record<Severity, DecorationOptions[]> = {
    [Severity.INFO]: [],
    [Severity.LOW]: [],
    [Severity.MEDIUM]: [],
    [Severity.HIGH]: [],
    [Severity.CRITICAL]: [],
  }

  WorkspaceState.findingList.forEach(item => {
    const filePath = getFindingAbsolutePath(item)

    if (filePath === null || item.line === null || normalize(filePath) !== normalize(editor.document.uri.fsPath)) return

    const range = editor.document.lineAt(item.line - 1).range
    decorationsBySeverity[item.severity].push({
      range,
      hoverMessage: getFindingDetails(item),
    })
  })

  severityList.forEach(severity => {
    editor.setDecorations(severityDecorationMap[severity], decorationsBySeverity[severity])
  })
}
