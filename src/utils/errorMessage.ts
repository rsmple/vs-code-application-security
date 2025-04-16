import {type TreeView, window} from 'vscode'

export const showErrorMessage = <T>(text: string, view?: TreeView<T>) => {
  window.showErrorMessage(text)

  if (view) view.message = text
}
