import {type ExtensionContext, Uri, commands, window, workspace} from 'vscode'

import WorkspaceState from '@ext/utils/WorkspaceState'

import {TriageStatus} from '@/models/TriageStatus'
import FindingApi from '@ext/api/modules/FindingApi'
import {parseSettingsSetup, setupSettings} from '@ext/models/Settings'
import {CommandName, SETTINGS_KEY, ViewName} from '@ext/package'
import {checkFindings} from '@ext/providers/CheckFindings'
import {applyDecorationsFinding} from '@ext/providers/DecorationsFinding'
import {treeDataProviderFinding} from '@ext/providers/TreeDataProviderFinding'
import {setContext} from '@ext/utils/Context'
import {getGitEmail} from '@ext/utils/GitConfig'
import {outputChannel} from '@ext/utils/OutputChannel'

import {addSuggestedProvider} from './providers/SuggestedProvider'
import {WebviewProvider} from './providers/WebviewProvider'

export function activate(context: ExtensionContext) {
  setContext(context)

  context.subscriptions.push(
    commands.registerCommand(CommandName.SETUP, setupSettings),
  )

  context.subscriptions.push(
    commands.registerCommand(CommandName.CONFIGURE, () => {
      commands.executeCommand('workbench.action.openSettings', SETTINGS_KEY)
    }),
  )

  context.subscriptions.push(
    commands.registerCommand(CommandName.CHECK_FINDINGS, checkFindings),
  )

  context.subscriptions.push(
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
    }),
  )

  context.subscriptions.push(
    window.registerUriHandler({
      handleUri(uri: Uri) {
        outputChannel.appendLine(`Handle URI: ${ uri.path }`)

        const settingsSetup = parseSettingsSetup(Object.fromEntries(new URLSearchParams(uri.query).entries()))

        if (!settingsSetup) return

        commands.executeCommand(CommandName.SETUP, settingsSetup)
      },
    }),
  )

  context.subscriptions.push(
    window.registerWebviewViewProvider(ViewName.WEBVIEW, new WebviewProvider()),
  )

  context.subscriptions.push(
    window.onDidChangeActiveTextEditor(applyDecorationsFinding, null, context.subscriptions),
  )

  context.subscriptions.push(
    workspace.onDidChangeTextDocument(e => {
      const editor = window.activeTextEditor

      if (!editor || (e.document !== editor.document)) return

      applyDecorationsFinding()
    }, null, context.subscriptions),
  )

  addSuggestedProvider()

  commands.executeCommand(CommandName.CHECK_FINDINGS)
}

export function deactivate() {
}
