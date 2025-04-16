import {type ExtensionContext, commands, languages, window, workspace} from 'vscode'

import {SETTINGS_KEY} from './models/Settings'
import {severityChoiceMap, severityList, severityTitleMap} from './models/Severity'
import {CommandName} from './package'
import {checkFindings} from './providers/CheckFindings'
import {CodeLensProviderFinding} from './providers/CodeLensProviderFinding'
import {applyDecorationsFinding} from './providers/DecorationsFinding'
import {treeDataProviderFinding} from './providers/TreeDataProviderFinding'
import {setContext} from './utils/Context'

export function activate(context: ExtensionContext) {
  setContext(context)

  languages.registerCodeLensProvider({scheme: 'file'}, new CodeLensProviderFinding())

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

  commands.executeCommand(CommandName.CHECK_FINDINGS)

  window.onDidChangeActiveTextEditor(applyDecorationsFinding, null, context.subscriptions)

  workspace.onDidChangeTextDocument(() => {
    applyDecorationsFinding()
  }, null, context.subscriptions)
}

export function deactivate() {
}
