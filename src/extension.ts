import type {Finding} from './models/Finding'

import {type ExtensionContext, Uri, commands, window, workspace} from 'vscode'

import FindingApi from './api/modules/FindingApi'
import {parseSettingsSetup, setupSettings} from './models/Settings'
import {severityChoiceMap, severityList, severityTitleMap} from './models/Severity'
import {TriageStatus} from './models/TriageStatus'
import {CommandName, SETTINGS_KEY} from './package'
import {checkFindings} from './providers/CheckFindings'
import {applyDecorationsFinding} from './providers/DecorationsFinding'
import {treeDataProviderFinding} from './providers/TreeDataProviderFinding'
import {setContext} from './utils/Context'
import {outputChannel} from './utils/OutputChannel'

export function activate(context: ExtensionContext) {
  setContext(context)

  commands.registerCommand(CommandName.SETUP, setupSettings)

  const disposable = window.registerUriHandler({
    handleUri(uri: Uri) {
      outputChannel.appendLine(`Handle URI: ${ uri.path }`)

      const settingsSetup = parseSettingsSetup(Object.fromEntries(new URLSearchParams(uri.query).entries()))

      if (!settingsSetup) return

      commands.executeCommand(CommandName.SETUP, settingsSetup)
    },
  })

  context.subscriptions.push(disposable)

  commands.registerCommand(CommandName.SET_FILTER, async () => {
    const choice = await window.showQuickPick([
      'All',
      ...severityList.map(severity => severityTitleMap[severity]),
    ], {
      placeHolder: 'Choose severity level',
    })
    if (choice) {
      treeDataProviderFinding.setFilter(severityChoiceMap[choice] ?? null)

      applyDecorationsFinding()
    }
  })

  commands.registerCommand(CommandName.CONFIGURE, () => {
    commands.executeCommand('workbench.action.openSettings', SETTINGS_KEY)
  })

  commands.registerCommand(CommandName.CHECK_FINDINGS, checkFindings)

  commands.registerCommand(CommandName.REJECT_FINDING, async (finding: Finding) => {
    await FindingApi.setStatus(finding.id, TriageStatus.REJECTED, undefined)

    commands.executeCommand(CommandName.CHECK_FINDINGS)
  })

  commands.executeCommand(CommandName.CHECK_FINDINGS)

  window.onDidChangeActiveTextEditor(applyDecorationsFinding, null, context.subscriptions)

  workspace.onDidChangeTextDocument(e => {
    const editor = window.activeTextEditor

    if (!editor || (e.document !== editor.document)) return

    applyDecorationsFinding()
  }, null, context.subscriptions)
}

export function deactivate() {
}
