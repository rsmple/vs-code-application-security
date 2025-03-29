import * as vscode from 'vscode'

import * as fs from 'fs'
import * as path from 'path'

import AssetApi from './api/modules/AssetApi'
import FindingApi from './api/modules/FindingApi'
import ProfileApi from './api/modules/ProfileApi'
import {AssetType} from './models/Asset'
import {type Settings, getSavedSettings, saveSettings} from './models/Settings'
import {severityTitleMap} from './models/Severity'
import {triageStatusTitleMap} from './models/TriageStatus'
import {setContext} from './utils/Context'

let vulnerabilityAnnotations: Vulnerability[] = []

interface Vulnerability {
    filePath: string
    line: number // нумерация с 0
    details: string
    severity: string
}

const outputChannel = vscode.window.createOutputChannel('AppSec Portal')

/** Декорации для подсветки уязвимостей по severity */

const severityDecorations: Record<Vulnerability['severity'], vscode.TextEditorDecorationType> = {
  info: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(0, 0, 255, 0.2)',  // синий
  }),
  low: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(0, 255, 0, 0.2)',  // зеленый
  }),
  medium: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 255, 0, 0.2)', // желтый
  }),
  high: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 165, 0, 0.2)', // оранжевый
  }),
  critical: vscode.window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 0, 0, 0.3)',   // красный
    border: '1px solid red',
  }),
}

/** Применение декораций в активном редакторе */

function applyVulnerabilityDecorations() {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    return
  }
  const {vuln_highlighting_enabled} = getSavedSettings()
  if (!vuln_highlighting_enabled) {
    (Object.keys(severityDecorations) as Vulnerability['severity'][]).forEach(sev => {
      editor.setDecorations(severityDecorations[sev], [])
    })
    return
  }

  const filePath = editor.document.uri.fsPath
  const decorationsBySeverity: Record<Vulnerability['severity'], vscode.DecorationOptions[]> = {
    info: [],
    low: [],
    medium: [],
    high: [],
    critical: [],
  }

  vulnerabilityAnnotations.forEach(vuln => {
    outputChannel.appendLine('S: ' + vuln.severity)
    if (path.normalize(vuln.filePath) === path.normalize(filePath)) {
      const range = editor.document.lineAt(vuln.line).range
      decorationsBySeverity[vuln.severity].push({
        range,
        hoverMessage: vuln.details,
      })
    }
  });

  (Object.keys(decorationsBySeverity) as Vulnerability['severity'][]).forEach(sev => {
    editor.setDecorations(severityDecorations[sev], decorationsBySeverity[sev])
  })
}

/** CodeLens Provider для отображения кнопки Details под каждой уязвимостью */

class VulnerabilityCodeLensProvider implements vscode.CodeLensProvider {
  private onDidChangeCodeLensesEmitter = new vscode.EventEmitter<void>()
  public readonly onDidChangeCodeLenses = this.onDidChangeCodeLensesEmitter.event

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = []
    vulnerabilityAnnotations.forEach(vuln => {
      if (path.normalize(vuln.filePath) === path.normalize(document.uri.fsPath)) {
        const line = vuln.line
        const range = document.lineAt(line).range
        const cmd: vscode.Command = {
          title: 'Details',
          command: 'appsec.showDetailsForVulnerability',
          arguments: [vuln],
        }
        codeLenses.push(new vscode.CodeLens(range, cmd))
      }
    })
    return codeLenses
  }
}

function showDetailsWebview(vuln: Vulnerability) {
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
        <h2>Уязвимость: ${ vuln.severity }</h2>
        <pre>${ vuln.details }</pre>
    </body>
    </html>
    `
}

/** Функция открытия настроек в виде WebView */
function openSettingsPanel() {
  const settings = getSavedSettings()
  const panel = vscode.window.createWebviewPanel(
    'appsecSettings',
    'Настройки AppSec',
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
    },
  )

  panel.webview.html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <title>Настройки AppSec</title>
        <style>
            body { font-family: sans-serif; padding: 20px; }
            label { display: block; margin-top: 10px; }
            input[type="text"], input[type="url"] { width: 100%; padding: 5px; }
            .toggle { margin-top: 10px; }
            button { margin-top: 20px; padding: 10px 20px; }
        </style>
    </head>
    <body>
        <h2>Настройки AppSec</h2>
        <label>Токен:</label>
        <input type="text" id="token" value="${ settings.token }" placeholder="Введите токен" />
        
        <label>Базовый URL:</label>
        <input type="url" id="base_url" value="${ settings.base_url }" placeholder="https://portal-demo.whitespots.io" />
        
        <div class="toggle">
            <label>
                <input type="checkbox" id="highlighting" ${ settings.vuln_highlighting_enabled ? 'checked' : '' } />
                Включить подсветку уязвимостей
            </label>
        </div>
        
        <button id="save">Сохранить настройки</button>
        
        <script>
            const vscode = acquireVsCodeApi();
            document.getElementById('save').addEventListener('click', () => {
                const token = document.getElementById('token').value;
                const baseUrl = document.getElementById('baseUrl').value;
                const highlighting = document.getElementById('highlighting').checked;
                vscode.postMessage({
                    command: 'saveSettings',
                    token,
                    baseUrl,
                    vulnHighlightingEnabled: highlighting
                });
            });
        </script>
    </body>
    </html>
    `

  panel.webview.onDidReceiveMessage((message: Settings) => {
    if (message.command === 'saveSettings') {
      saveSettings(message)
      vscode.window.showInformationMessage('Настройки сохранены!')
      applyVulnerabilityDecorations()
      panel.dispose()
    }
  })
}

/** Основная функция проверки уязвимостей. **/
async function checkVulnerabilities(vulnerabilityProvider: VulnerabilityTreeDataProvider) {
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
      triage_status: 2,
      assets__in: {0: [repoUrl]},
      page: 1,
    })
    if (!findingsData.data.results || findingsData.data.results.length === 0) {
      vscode.window.showInformationMessage('Уязвимости не найдены.')
      return
    }
    outputChannel.appendLine(`Найдено уязвимостей: ${ findingsData.data.count }`)

    vulnerabilityAnnotations = []
    let noteText = 'Найденные уязвимости:\n\n'
    findingsData.data.results.forEach((finding) => {
      noteText += `-----------------------------\n`
      noteText += `ID: ${ finding.id }\n`
      noteText += `Название: ${ finding.name }\n`
      noteText += `Файл: ${ finding.file_path }\n`
      noteText += `Строка: ${ finding.line }\n`
      noteText += `nStatus: ${ triageStatusTitleMap[finding.current_sla_level] }\n`
      noteText += `CVSS: ${ finding.cvss && finding.cvss['3.1'] ? finding.cvss['3.1'].score : 'N/A' }\n`
      noteText += `Дата верификации: ${ finding.date_verified }\n\n`

      if (finding.file_path && finding.line) {
        const absoluteFilePath = path.join(workspaceRoot, finding.file_path)
        const details = `ID: ${ finding.id }\nНазвание: ${ finding.name }\nStatus: ${ triageStatusTitleMap[finding.current_sla_level] }\nCVSS: ${ finding.cvss?.['3.1']?.score || 'N/A' }\nДата: ${ finding.date_verified }`
        vulnerabilityAnnotations.push({
          filePath: absoluteFilePath,
          line: Number(finding.line) - 1,
          details: details,
          severity: severityTitleMap[finding.severity],
        })
      }
    })
    outputChannel.appendLine('ready')

    applyVulnerabilityDecorations()
    vulnerabilityProvider.updateVulnerabilities(vulnerabilityAnnotations)
    outputChannel.appendLine(noteText)
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    vscode.window.showErrorMessage(`Ошибка: ${ errorMsg }`)
    console.error(error)
  }
}

/** Реализация TreeView для уязвимостей */

class VulnerabilityTreeItem extends vscode.TreeItem {
  constructor(
        public readonly label: string,
        public readonly filePath: string,
        public readonly line: number,
        public readonly severity: Vulnerability['severity'],
        public readonly command?: vscode.Command,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
  ) {
    super(label, collapsibleState)
    this.contextValue = severity
  }
}

class VulnerabilityTreeDataProvider implements vscode.TreeDataProvider<VulnerabilityTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<VulnerabilityTreeItem | undefined | void> = new vscode.EventEmitter<VulnerabilityTreeItem | undefined | void>()
  readonly onDidChangeTreeData: vscode.Event<VulnerabilityTreeItem | undefined | void> = this._onDidChangeTreeData.event

  private vulnerabilities: Vulnerability[] = []
  private severityFilter: Vulnerability['severity'] | 'all' = 'all'

  public updateVulnerabilities(vulns: Vulnerability[]) {
    this.vulnerabilities = vulns
    this._onDidChangeTreeData.fire()
  }

  public setFilter(severity: Vulnerability['severity'] | 'all') {
    this.severityFilter = severity
    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: VulnerabilityTreeItem): vscode.TreeItem {
    return element
  }

  getChildren(element?: VulnerabilityTreeItem): Thenable<VulnerabilityTreeItem[]> {
    if (!element) {
      const groups: Record<string, Vulnerability[]> = {}
      this.vulnerabilities.forEach(vuln => {
        if (this.severityFilter !== 'all' && vuln.severity !== this.severityFilter) {
          return
        }
        groups[vuln.filePath] = groups[vuln.filePath] || []
        groups[vuln.filePath].push(vuln)
      })
      return Promise.resolve(
        Object.entries(groups).map(([filePath]) => {
          const label = path.basename(filePath)
          return new VulnerabilityTreeItem(label, filePath, 0, 'info', undefined, vscode.TreeItemCollapsibleState.Collapsed)
        }),
      )
    } else {
      const vulns = this.vulnerabilities.filter(vuln => vuln.filePath === element.filePath && (this.severityFilter === 'all' || vuln.severity === this.severityFilter))
      return Promise.resolve(
        vulns.map(vuln => new VulnerabilityTreeItem(
          `Строка ${ vuln.line + 1 } - ${ vuln.severity }`,
          vuln.filePath,
          vuln.line,
          vuln.severity,
          {
            command: 'vscode.open',
            title: 'Открыть файл',
            arguments: [vscode.Uri.file(vuln.filePath), {selection: new vscode.Range(vuln.line, 0, vuln.line, 0)}],
          },
        )),
      )
    }
  }
}

/** Функция активации расширения */

export function activate(context: vscode.ExtensionContext) {
  setContext(context)

  const vulnerabilityProvider = new VulnerabilityTreeDataProvider()

  vscode.window.registerTreeDataProvider('appsecVulnerabilities', vulnerabilityProvider)

  vscode.languages.registerCodeLensProvider({scheme: 'file'}, new VulnerabilityCodeLensProvider())

  vscode.commands.registerCommand('appsecVulnerabilities.setFilter', async () => {
    const choice = await vscode.window.showQuickPick(['all', 'info', 'low', 'medium', 'high', 'critical'], {
      placeHolder: 'Выберите уровень severity для фильтрации',
    })
    if (choice) {
      vulnerabilityProvider.setFilter(choice as Vulnerability['severity'] | 'all')
    }
  })

  vscode.commands.registerCommand('appsec.configure', () => {
    openSettingsPanel()
  })

  vscode.commands.registerCommand('appsec.checkVulnerabilities', async () => {
    const {token} = getSavedSettings()
    if (!token) {
      vscode.window.showErrorMessage('Токен не привязан. Настройте расширение через "AppSec: Настроить".')
      return
    }
    await checkVulnerabilities(vulnerabilityProvider)
  })

  vscode.commands.registerCommand('appsec.showDetailsForVulnerability', (vuln: Vulnerability) => {
    showDetailsWebview(vuln)
  })

  const {token} = getSavedSettings()
  if (token) {
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
