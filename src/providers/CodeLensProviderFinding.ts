import {CodeLens, type CodeLensProvider, EventEmitter, type TextDocument} from 'vscode'

import WorkspaceState from '@/utils/WorkspaceState'

import {normalize} from 'path'

import {getFindingAbsolutePath} from '@/models/Finding'

export class CodeLensProviderFinding implements CodeLensProvider {
  private onDidChangeCodeLensesEmitter = new EventEmitter<void>()
  public readonly onDidChangeCodeLenses = this.onDidChangeCodeLensesEmitter.event

  provideCodeLenses(document: TextDocument): CodeLens[] {
    const codeLenses: CodeLens[] = []
    WorkspaceState.findingList.forEach(item => {
      const filePath = getFindingAbsolutePath(item)

      if (filePath === null || item.line === null || normalize(filePath) !== normalize(document.uri.fsPath)) return

      // const range = document.lineAt(item.line).range

      // codeLenses.push(new CodeLens(range, {
      //   title: 'Details',
      //   command: CommandName.FINDING_DETAILS,
      //   arguments: [item],
      // }))
    })
    return codeLenses
  }
}
