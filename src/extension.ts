import * as vscode from 'vscode'

import * as fs from 'fs'
import * as path from 'path'

import AssetApi from './api/modules/AssetApi'
import FindingApi from './api/modules/FindingApi'
import ProfileApi from './api/modules/ProfileApi'
import {AssetType} from './models/Asset'
import {Finding, getFindingAbsolutePath, getFindingDetails} from './models/Finding'
import {SETTINGS, getSavedSettings} from './models/Settings'
import {Severity, severityChoiceMap, severityDecorationMap, severityList, severityTitleMap} from './models/Severity'
import {TriageStatus} from './models/TriageStatus'
import {TreeDataProviderFinding} from './providers/TreeDataProviderFinding'
import {setContext} from './utils/Context'
import {outputChannel} from './utils/OutputChannel'

let findingList: Finding[] = []

function applyVulnerabilityDecorations() {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    return
  }
  const settings = getSavedSettings()
  if (!settings.personalization.highlight) {
    severityList.forEach(severity => {
      editor.setDecorations(severityDecorationMap[severity], [])
    })
    return
  }

  const filePath = editor.document.uri.fsPath
  const decorationsBySeverity: Record<Severity, vscode.DecorationOptions[]> = {
    [Severity.INFO]: [],
    [Severity.LOW]: [],
    [Severity.MEDIUM]: [],
    [Severity.HIGH]: [],
    [Severity.CRITICAL]: [],
  }

  findingList.forEach(finding => {
    const findingPath = getFindingAbsolutePath(finding)

    if (findingPath === null || finding.line === null) return

    if (path.normalize(findingPath) === path.normalize(filePath)) {
      const range = editor.document.lineAt(finding.line - 1).range
      decorationsBySeverity[finding.severity].push({
        range,
        hoverMessage: getFindingDetails(finding),
      })
    }
  })

  severityList.forEach(severity => {
    editor.setDecorations(severityDecorationMap[severity], decorationsBySeverity[severity])
  })
}

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

/** Основная функция проверки уязвимостей. **/
async function checkVulnerabilities(treeDataProviderFinding: TreeDataProviderFinding) {
  outputChannel.appendLine('Начало проверки уязвимостей')

  try {
    // Верификация токена
    outputChannel.appendLine('Верификация токена...')
    const profileData = await ProfileApi.getItem()
    outputChannel.appendLine(`Профиль: ${ profileData.data.username } (${ profileData.data.email })`)

    if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('Открытых рабочих папок не найдено.')
      return
    }
    const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath
    const gitConfigPath = path.join(workspaceRoot, '.git', 'config')
    if (!fs.existsSync(gitConfigPath)) {
      vscode.window.showErrorMessage('.git/config не найден в корне проекта.')
      return
    }
    const gitConfigContent = fs.readFileSync(gitConfigPath, 'utf8')
    const repoUrlMatch = gitConfigContent.match(/url\s*=\s*(.+)/)
    if (!repoUrlMatch) {
      vscode.window.showErrorMessage('Не удалось извлечь URL репозитория из .git/config')
      return
    }
    const repoUrl = repoUrlMatch[1].trim()
    outputChannel.appendLine(`Найден URL репозитория: ${ repoUrl }`)

    outputChannel.appendLine('Проверка репозитория в системе...')
    const assetData = await AssetApi.getList({asset_type: AssetType.REPOSITORY, search: repoUrl})
    if (!assetData.data.results || assetData.data.results.length === 0) {
      vscode.window.showInformationMessage('Репозиторий не найден в системе.')
      return
    }
    outputChannel.appendLine(`Найдено ${ assetData.data.results.length } активов для репозитория`)

    let selectedAsset = assetData.data.results[0]
    for (const asset of assetData.data.results) {
      if ((asset.verified_and_assigned_findings_count || 0) > (selectedAsset.verified_and_assigned_findings_count || 0)) {
        selectedAsset = asset
      }
    }
    if (!selectedAsset.verified_and_assigned_findings_count || selectedAsset.verified_and_assigned_findings_count === 0) {
      vscode.window.showInformationMessage('Для данного репозитория не обнаружены верифицированные активы.')
      return
    }
    outputChannel.appendLine(`Используем product id: ${ selectedAsset.product }`)

    outputChannel.appendLine('Запрос уязвимостей...')
    const findingsData = await FindingApi.getList({
      product: selectedAsset.product,
      triage_status: TriageStatus.VERIFIED,
      assets__in: {0: [repoUrl]},
      page: 1,
    })
    if (!findingsData.data.results || findingsData.data.results.length === 0) {
      vscode.window.showInformationMessage('Уязвимости не найдены.')
      return
    }
    outputChannel.appendLine(`Найдено уязвимостей: ${ findingsData.data.count }`)

    const noteText = 'Найденные уязвимости:\n\n'
    findingList = findingsData.data.results
    outputChannel.appendLine('ready')

    applyVulnerabilityDecorations()
    treeDataProviderFinding.updateVulnerabilities(findingList)
    outputChannel.appendLine(noteText)
  } catch (error) {
    vscode.window.showErrorMessage(`Ошибка: ${ JSON.stringify(error) }`)
    console.error(error)
  }
}

/** Функция активации расширения */

export function activate(context: vscode.ExtensionContext) {
  setContext(context)

  const treeDataProviderFinding = new TreeDataProviderFinding()

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
    vscode.commands.executeCommand('workbench.action.openSettings', SETTINGS);
  })

  vscode.commands.registerCommand('appsec.checkVulnerabilities', async () => {
    const settings = getSavedSettings()
    if (!settings.base.token) {
      vscode.window.showErrorMessage('Токен не привязан. Настройте расширение через "AppSec: Настроить".')
      return
    }
    await checkVulnerabilities(treeDataProviderFinding)
  })

  vscode.commands.registerCommand('appsec.showDetailsForVulnerability', (vuln: Finding) => {
    showDetailsWebview(vuln)
  })

  const settings = getSavedSettings()
  if (settings.base.token) {
    vscode.commands.executeCommand('appsec.checkVulnerabilities')
  } else {
    vscode.window.showErrorMessage('Токен не привязан. Настройте расширение через "AppSec: Настроить".')
  }

  vscode.window.onDidChangeActiveTextEditor(applyVulnerabilityDecorations, null, context.subscriptions)
  vscode.workspace.onDidChangeTextDocument(() => {
    applyVulnerabilityDecorations()
  }, null, context.subscriptions)
}

export function deactivate() {
}
