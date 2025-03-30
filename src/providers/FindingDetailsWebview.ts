import {ViewColumn, window} from 'vscode'

import {type Finding, getFindingDetails} from '@/models/Finding'
import {severityTitleMap} from '@/models/Severity'

export const showDetailsWebview = (finding: Finding) => {
  const panel = window.createWebviewPanel(
    'appsecDetails',
    'Finding details',
    {viewColumn: ViewColumn.Beside, preserveFocus: true},
    {},
  )

  panel.webview.html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <title>Finding details</title>
        <style>
            body { font-family: sans-serif; padding: 10px; }
            pre { background: #f0f0f0; padding: 10px; }
        </style>
    </head>
    <body>
        <h2>${ severityTitleMap[finding.severity] }: ${ finding.name }</h2>
        <pre>${ getFindingDetails(finding) }</pre>
    </body>
    </html>
    `
}
