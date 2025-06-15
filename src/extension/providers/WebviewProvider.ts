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

      enableCommandUris: true,
      enableFindWidget: true,
      enableForms: true,
      enableSandbox: false, 
    } as typeof webview.options

    const scriptUri = webview.asWebviewUri(Uri.joinPath(context.extensionUri, 'webview', 'main.js'))
    const styleUri = webview.asWebviewUri(Uri.joinPath(context.extensionUri, 'webview/assets', 'main.css'))

    webview.html = this.getHtml(scriptUri, styleUri)

    outputChannel.appendLine(this.getHtml(scriptUri, styleUri))
  }

  getHtml(scriptUri: Uri, styleUrl: Uri) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  ${ process.env.NODE_ENV === 'development' ? '<script type="module" src="/@vite/client"></script>' : '' }
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Webview</title>
${ process.env.NODE_ENV === 'development' ? '' : `
  <script type="module" crossorigin src="${ scriptUri }"></script>
  <link rel="stylesheet" crossorigin href="${ styleUrl }">
` }
</head>
<body>
  <div id="app"></div>
  ${ process.env.NODE_ENV === 'development' ? '<script type="module" src="http://localhost:5173/main.ts"></script>' : '' }
</body>
</html>`
  }
}