import * as vscode from 'vscode'

import * as fs from 'fs'
import * as path from 'path'

/** Глобальная переменная для хранения аннотаций (найденных уязвимостей) */
let vulnerabilityAnnotations: Vulnerability[] = []

/** Интерфейсы и типы */

// Интерфейс для уязвимости
interface Vulnerability {
    filePath: string
    line: number // нумерация с 0
    details: string
    severity: 'info' | 'low' | 'medium' | 'high' | 'critical'
}

// Интерфейс для профиля пользователя
interface ProfileData {
    username: string
    email: string
}

// Интерфейсы для данных активов
interface Asset {
    product: number
    id: number
    value: string
    asset_type: number
    job_sequence: number | null
    repository_url_config: number
    related_objects_meta: {
        product: {
            id: number
            name: string
            is_default: boolean
            business_criticality: number
            related_objects_meta: {
                product_type: {
                    name: string
                }
            }
        }
    }
    tags: any[]
    cloud_key_id: string
    cloud_key_secret: string | null
    verified_and_assigned_findings_count: number
    unverified_findings_count: number
}

interface AssetData {
    next: string | null
    previous: string | null
    current: number
    count: number
    pages_count: number
    results: Asset[]
}

interface Finding {
    id: number
    name: string
    file_path: string
    line: string | number
    status: string
    cvss?: { [version: string]: { score: number } }
    date_verified: string
    severity?: 'info' | 'low' | 'medium' | 'high' | 'critical'
}

interface FindingsData {
    next: string | null
    previous: string | null
    current: number
    count: number
    pages_count: number
    results: Finding[]
}

/** Функции для получения настроек */

function saveSettings(context: vscode.ExtensionContext, token: string, baseUrl: string, vulnHighlightingEnabled: boolean) {
  context.globalState.update('appsecToken', token)
  context.globalState.update('appsecBaseUrl', baseUrl)
  context.globalState.update('vulnHighlightingEnabled', vulnHighlightingEnabled)
}

function getSavedSettings(context: vscode.ExtensionContext): { token?: string, baseUrl?: string, vulnHighlightingEnabled?: boolean } {
  const token = context.globalState.get<string>('appsecToken')
  const baseUrl = context.globalState.get<string>('appsecBaseUrl')
  const vulnHighlightingEnabled = context.globalState.get<boolean>('vulnHighlightingEnabled', true)
  return {token, baseUrl, vulnHighlightingEnabled}
}

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
  const {vulnHighlightingEnabled} = getSavedSettings(extensionContext)
  if (!vulnHighlightingEnabled) {
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

  provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] {
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
function openSettingsPanel(context: vscode.ExtensionContext) {
  const {token = '', baseUrl = 'https://portal-demo.whitespots.io', vulnHighlightingEnabled = true} = getSavedSettings(context)
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
        <input type="text" id="token" value="${ token }" placeholder="Введите токен" />
        
        <label>Базовый URL:</label>
        <input type="url" id="baseUrl" value="${ baseUrl }" placeholder="https://portal-demo.whitespots.io" />
        
        <div class="toggle">
            <label>
                <input type="checkbox" id="highlighting" ${ vulnHighlightingEnabled ? 'checked' : '' } />
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

  panel.webview.onDidReceiveMessage(message => {
    if (message.command === 'saveSettings') {
      saveSettings(context, message.token, message.baseUrl, message.vulnHighlightingEnabled)
      vscode.window.showInformationMessage('Настройки сохранены!')
      applyVulnerabilityDecorations()
      panel.dispose()
    }
  })
}

/** Основная функция проверки уязвимостей. **/
async function checkVulnerabilities(context: vscode.ExtensionContext, vulnerabilityProvider: VulnerabilityTreeDataProvider) {
  const outputChannel = vscode.window.createOutputChannel('AppSec Portal')
  outputChannel.appendLine('Начало проверки уязвимостей')

  const {token, baseUrl} = getSavedSettings(context)
  if (!token) {
    vscode.window.showErrorMessage('Токен не привязан. Пожалуйста, настройте расширение через "AppSec: Настроить".')
    return
  }
  const API_BASE = (baseUrl || 'https://portal-demo.whitespots.io') + '/api/v1'

  try {
    const {default: fetch} = await import('node-fetch')

    // Верификация токена
    outputChannel.appendLine('Верификация токена...')
    const profileResponse = await fetch(`${ API_BASE }/profile/`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Token ${ token }`,
      },
    })
    const profileData = (await profileResponse.json()) as ProfileData
    outputChannel.appendLine(`Профиль: ${ profileData.username } (${ profileData.email })`)

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
    const assetResponse = await fetch(`${ API_BASE }/product-assets/?asset_type=0&search=${ encodeURIComponent(repoUrl) }`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Token ${ token }`,
      },
    })
    const assetData = (await assetResponse.json()) as AssetData
    if (!assetData.results || assetData.results.length === 0) {
      vscode.window.showInformationMessage('Репозиторий не найден в системе.')
      return
    }
    outputChannel.appendLine(`Найдено ${ assetData.results.length } активов для репозитория`)

    let selectedAsset = assetData.results[0]
    for (const asset of assetData.results) {
      if ((asset.verified_and_assigned_findings_count || 0) > (selectedAsset.verified_and_assigned_findings_count || 0)) {
        selectedAsset = asset
      }
    }
    if (!selectedAsset.verified_and_assigned_findings_count || selectedAsset.verified_and_assigned_findings_count === 0) {
      vscode.window.showInformationMessage('Для данного репозитория не обнаружены верифицированные активы.')
      return
    }
    outputChannel.appendLine(`Используем product id: ${ selectedAsset.product }`)

    const findingsQuery = {
      product: selectedAsset.product,
      triage_status: 2,
      assets__in: {0: [repoUrl]},
      page: 1,
    }
    const findingsUrl = `${ API_BASE }/findings/?product=${ findingsQuery.product }&triage_status=${ findingsQuery.triage_status }&assets__in=${ encodeURIComponent(JSON.stringify(findingsQuery.assets__in)) }&page=${ findingsQuery.page }`
    outputChannel.appendLine('Запрос уязвимостей...')
    const findingsResponse = await fetch(findingsUrl, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Token ${ token }`,
      },
    })
    const findingsData = (await findingsResponse.json()) as FindingsData
    if (!findingsData.results || findingsData.results.length === 0) {
      vscode.window.showInformationMessage('Уязвимости не найдены.')
      return
    }
    outputChannel.appendLine(`Найдено уязвимостей: ${ findingsData.count }`)

    vulnerabilityAnnotations = []
    let noteText = 'Найденные уязвимости:\n\n'
    findingsData.results.forEach((finding: Finding) => {
      noteText += `-----------------------------\n`
      noteText += `ID: ${ finding.id }\n`
      noteText += `Название: ${ finding.name }\n`
      noteText += `Файл: ${ finding.file_path }\n`
      noteText += `Строка: ${ finding.line }\n`
      noteText += `Статус: ${ finding.status }\n`
      noteText += `CVSS: ${ finding.cvss && finding.cvss['3.1'] ? finding.cvss['3.1'].score : 'N/A' }\n`
      noteText += `Дата верификации: ${ finding.date_verified }\n\n`

      if (finding.file_path && finding.line) {
        const absoluteFilePath = path.join(workspaceRoot, finding.file_path)
        const details = `ID: ${ finding.id }\nНазвание: ${ finding.name }\nСтатус: ${ finding.status }\nCVSS: ${ finding.cvss?.['3.1']?.score || 'N/A' }\nДата: ${ finding.date_verified }`
        vulnerabilityAnnotations.push({
          filePath: absoluteFilePath,
          line: Number(finding.line) - 1,
          details: details,
          severity: finding.severity || 'info',
        })
      }
    })

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
        Object.entries(groups).map(([filePath, vulns]) => {
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

let extensionContext: vscode.ExtensionContext

/** Функция активации расширения */

export function activate(context: vscode.ExtensionContext) {
  extensionContext = context
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
    openSettingsPanel(context)
  })

  vscode.commands.registerCommand('appsec.checkVulnerabilities', async () => {
    const {token} = getSavedSettings(context)
    if (!token) {
      vscode.window.showErrorMessage('Токен не привязан. Настройте расширение через "AppSec: Настроить".')
      return
    }
    await checkVulnerabilities(context, vulnerabilityProvider)
  })

  vscode.commands.registerCommand('appsec.showDetailsForVulnerability', (vuln: Vulnerability) => {
    showDetailsWebview(vuln)
  })

  const {token} = getSavedSettings(context)
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
