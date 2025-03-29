import {ExtensionContext} from 'vscode'

export let context: ExtensionContext

export const setContext = (value: ExtensionContext) => {
  context = value
}
