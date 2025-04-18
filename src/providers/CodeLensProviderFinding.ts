import {CodeLens, type CodeLensProvider, EventEmitter, type TextDocument, workspace} from 'vscode'

import {getFindingAbsolutePath} from '@/models/Finding'
import {CommandName} from '@/package'
import {outputChannel} from '@/utils/OutputChannel'

import {treeDataProviderFinding} from './TreeDataProviderFinding'

class CodeLensProviderFinding implements CodeLensProvider {
  private onDidChangeCodeLensesEmitter = new EventEmitter<void>()
  public readonly onDidChangeCodeLenses = this.onDidChangeCodeLensesEmitter.event

  provideCodeLenses(document: TextDocument): CodeLens[] {
    const codeLenses: CodeLens[] = []

    const path = workspace.asRelativePath(document.uri, false)

    const findingList = treeDataProviderFinding.groupList[path]

    if (!findingList?.length) return codeLenses

    outputChannel.appendLine(`Apply code lens for ${ path }`)

    findingList.forEach(item => {
      const filePath = getFindingAbsolutePath(item)

      if (filePath === null || item.line === null) return
      if (document.lineAt(item.line - 1).text !== item.line_text) return

      codeLenses.push(new CodeLens(document.lineAt(item.line).range, {
        title: 'Reject',
        command: CommandName.REJECT_FINDING,
        arguments: [item],
      }))
    })

    return codeLenses
  }
}

export const codeLensProviderFinding = new CodeLensProviderFinding()
