import {type ExtensionContext, commands, languages, window, workspace} from 'vscode'

import {SETTINGS_KEY} from './models/Settings'
import {severityChoiceMap, severityList, severityTitleMap} from './models/Severity'
import {CommandName} from './package'
import {checkFindings} from './providers/CheckFindings'
import {CodeLensProviderFinding} from './providers/CodeLensProviderFinding'
import {applyDecorationsFinding} from './providers/DecorationsFinding'
import {showDetailsWebview} from './providers/FindingDetailsWebview'
import {treeDataProviderFinding} from './providers/TreeDataProviderFinding'
import {setContext} from './utils/Context'

export function activate(context: ExtensionContext) {
  setContext(context)

  window.registerTreeDataProvider('appsecVulnerabilities', treeDataProviderFinding)

  languages.registerCodeLensProvider({scheme: 'file'}, new CodeLensProviderFinding())

  commands.registerCommand(CommandName.SET_FILTER, async () => {
    const choice = await window.showQuickPick(severityList.map(severity => severityTitleMap[severity]), {
      placeHolder: 'Выберите уровень severity для фильтрации',
    })
    if (choice) {
      treeDataProviderFinding.setFilter(severityChoiceMap[choice] ?? null)
    }
  })

  commands.registerCommand(CommandName.CONFIGURE, () => {
    commands.executeCommand('workbench.action.openSettings', SETTINGS_KEY)
  })

  commands.registerCommand(CommandName.CHECK_FINDINGS, async () => {
    await checkFindings()
  })

  commands.registerCommand(CommandName.FINDING_DETAILS, showDetailsWebview)

  commands.executeCommand(CommandName.CHECK_FINDINGS)

  window.onDidChangeActiveTextEditor(applyDecorationsFinding, null, context.subscriptions)
  workspace.onDidChangeTextDocument(() => {
    applyDecorationsFinding()
  }, null, context.subscriptions)
}

export function deactivate() {
}
