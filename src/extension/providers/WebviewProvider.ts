import {Uri, type WebviewView, type WebviewViewProvider} from 'vscode'

import {context} from '@ext/utils/Context'

import {outputChannel} from '../utils/OutputChannel'

export class WebviewProvider implements WebviewViewProvider {
  constructor() {}

  resolveWebviewView(webviewView: WebviewView) {
    const webview = webviewView.webview

    webview.options = {
      enableScripts: true,
      localResourceRoots: [Uri.joinPath(context.extensionUri, 'webview')],
    }

    const scriptUri = webview.asWebviewUri(
      Uri.joinPath(context.extensionUri, 'webview', 'main.js'),
    )

    webview.html = this.getHtml(scriptUri)

    outputChannel.appendLine(scriptUri.toString())
  }

  getHtml(scriptUri: Uri) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Webview</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="${ scriptUri }"></script>
</body>
</html>`
  }
}