import {ViewColumn, window} from 'vscode'

import {type Finding, getFindingDetails} from '@/models/Finding'

export const showDetailsWebview = (finding: Finding) => {
  const panel = window.createWebviewPanel(
    'appsecDetails',
    'Подробности уязвимости',
    {viewColumn: ViewColumn.Beside, preserveFocus: true},
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
