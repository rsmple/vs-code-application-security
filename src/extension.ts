import {type ExtensionContext, Uri, commands, window, workspace} from 'vscode'

import FindingApi from './api/modules/FindingApi'
import {parseSettingsSetup, setupSettings} from './models/Settings'
import {TriageStatus} from './models/TriageStatus'
import {CommandName, SETTINGS_KEY} from './package'
import {checkFindings} from './providers/CheckFindings'
import {applyDecorationsFinding} from './providers/DecorationsFinding'
import {treeDataProviderFinding} from './providers/TreeDataProviderFinding'
import {setContext} from './utils/Context'
import {getGitEmail} from './utils/GitConfig'
import {outputChannel} from './utils/OutputChannel'
import WorkspaceState from './utils/WorkspaceState'

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

  commands.registerCommand(CommandName.CONFIGURE, () => {
    commands.executeCommand('workbench.action.openSettings', SETTINGS_KEY)
  })

  commands.registerCommand(CommandName.CHECK_FINDINGS, checkFindings)

  commands.registerCommand(CommandName.REJECT_FINDING, async (findingId: number) => {
    outputChannel.appendLine(`Reject finding ${ findingId }`)

    const email = await getGitEmail()

    await Promise.all([
      FindingApi.setStatus(findingId, TriageStatus.REJECTED, undefined),
      FindingApi.addTag(findingId, {name: 'rejected_by_developer'}),
      email ? FindingApi.addTag(findingId, {name: email}) : undefined,
    ])
      .then(() => {
        window.showInformationMessage(`Rejected finding ${ findingId }`)

        const index = WorkspaceState.findingList.findIndex(item => item.id === findingId)

        if (index !== -1) {
          WorkspaceState.findingList.splice(index, 1)
          
          treeDataProviderFinding.updateList()

          applyDecorationsFinding()
        }
      })
      .catch(() => {
        const message = `Failed to reject finding ${ findingId }`

        outputChannel.appendLine(message)
        window.showErrorMessage(message)
      })
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
