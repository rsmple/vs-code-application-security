import * as vscode from 'vscode'

import * as path from 'path'

import {Finding, getFindingAbsolutePath, getFindingDetails} from './models/Finding'
import {SETTINGS} from './models/Settings'
import {severityChoiceMap, severityList, severityTitleMap} from './models/Severity'
import {checkFindings} from './providers/CheckFindings'
import {applyDecorationsFinding} from './providers/DecorationsFinding'
import {treeDataProviderFinding} from './providers/TreeDataProviderFinding'
import {setContext} from './utils/Context'

const findingList: Finding[] = []

/** CodeLens Provider для отображения кнопки Details под каждой уязвимостью */

class VulnerabilityCodeLensProvider implements vscode.CodeLensProvider {
  private onDidChangeCodeLensesEmitter = new vscode.EventEmitter<void>()
  public readonly onDidChangeCodeLenses = this.onDidChangeCodeLensesEmitter.event

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = []
    findingList.forEach(item => {
      const filePath = getFindingAbsolutePath(item)

      if (filePath === null || item.line === null || path.normalize(filePath) !== path.normalize(document.uri.fsPath)) return

      const range = document.lineAt(item.line).range
      const cmd: vscode.Command = {
        title: 'Details',
        command: 'appsec.showDetailsForVulnerability',
        arguments: [item],
      }
      codeLenses.push(new vscode.CodeLens(range, cmd))
    })
    return codeLenses
  }
}

function showDetailsWebview(finding: Finding) {
  const panel = vscode.window.createWebviewPanel(
    'appsecDetails',
    'Подробности уязвимости',
    {viewColumn: vscode.ViewColumn.Beside, preserveFocus: true},
    {},
  )

  panel.webview.html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <title>Подробности уязвимости</title>
        <style>
            body { font-family: sans-serif; padding: 10px; }
            pre { background: #f0f0f0; padding: 10px; }
        </style>
    </head>
    <body>
        <h2>Уязвимость: ${ finding.severity }</h2>
        <pre>${ getFindingDetails(finding) }</pre>
    </body>
    </html>
    `
}

/** Функция активации расширения */

export function activate(context: vscode.ExtensionContext) {
  setContext(context)

  vscode.window.registerTreeDataProvider('appsecVulnerabilities', treeDataProviderFinding)

  vscode.languages.registerCodeLensProvider({scheme: 'file'}, new VulnerabilityCodeLensProvider())

  vscode.commands.registerCommand('appsecVulnerabilities.setFilter', async () => {
    const choice = await vscode.window.showQuickPick(severityList.map(severity => severityTitleMap[severity]), {
      placeHolder: 'Выберите уровень severity для фильтрации',
    })
    if (choice) {
      treeDataProviderFinding.setFilter(severityChoiceMap[choice] ?? null)
    }
  })

  vscode.commands.registerCommand('appsec.configure', () => {
    vscode.commands.executeCommand('workbench.action.openSettings', SETTINGS)
  })

  vscode.commands.registerCommand('appsec.checkVulnerabilities', async () => {
    await checkFindings()
  })

  vscode.commands.registerCommand('appsec.showDetailsForVulnerability', (vuln: Finding) => {
    showDetailsWebview(vuln)
  })

  vscode.commands.executeCommand('appsec.checkVulnerabilities')

  vscode.window.onDidChangeActiveTextEditor(applyDecorationsFinding, null, context.subscriptions)
  vscode.workspace.onDidChangeTextDocument(() => {
    applyDecorationsFinding()
  }, null, context.subscriptions)
}

export function deactivate() {
}
