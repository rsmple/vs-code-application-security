import {type TextDocumentContentProvider, Uri, commands, workspace} from 'vscode'

import {CommandName} from '@ext/package'
import {context} from '@ext/utils/Context'
import {outputChannel} from '@ext/utils/OutputChannel'

class SuggestedContentProvider implements TextDocumentContentProvider {
  private contentMap = new Map<string, string>()

  setContent(uri: Uri, content: string) {
    this.contentMap.set(uri.toString(), content)
  }

  provideTextDocumentContent(uri: Uri): string | Thenable<string> {
    return this.contentMap.get(uri.toString()) ?? ''
  }
}

export const addSuggestedProvider = () => {
  const provider = new SuggestedContentProvider()
  const scheme = 'suggested'

  context.subscriptions.push(
    workspace.registerTextDocumentContentProvider(scheme, provider),
  )

  const disposable = commands.registerCommand(CommandName.SUGGEST, async (payload: {file_path: string, content: string}) => {
    outputChannel.appendLine(`Show suggestion ${ payload.file_path }`)

    const originalFileUri = Uri.file(payload.file_path)
    const doc = await workspace.openTextDocument(originalFileUri)

    const fileName = doc.fileName.substring(doc.fileName.lastIndexOf('/') + 1)

    const virtualUri = Uri.parse(`${ scheme }:/Suggested/${ fileName }`)
    provider.setContent(virtualUri, payload.content)

    await commands.executeCommand(
      'vscode.diff',
      originalFileUri,
      virtualUri,
      `Suggested Changes: ${ fileName }`,
    )
  })

  context.subscriptions.push(disposable)
}