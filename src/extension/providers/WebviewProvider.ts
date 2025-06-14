import {Uri, type WebviewView, type WebviewViewProvider} from 'vscode'

import {context} from '@ext/utils/Context'

export class ChatViewProvider implements WebviewViewProvider {
  resolveWebviewView(webviewView: WebviewView) {
    const webview = webviewView.webview
    webview.options = {
      enableScripts: true,
      localResourceRoots: [Uri.joinPath(context.extensionUri, 'extension/webview')],
    }

    const scriptUri = webview.asWebviewUri(
      Uri.joinPath(context.extensionUri, 'extension/webview', 'main.js'),
    )

    webview.html = this.getHtml(scriptUri)
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