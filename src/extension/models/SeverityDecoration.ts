import {type TextEditorDecorationType, window} from 'vscode'

import {Severity} from '@/models/Severity'

export const severityDecorationMap: Record<Severity, TextEditorDecorationType> = {
  [Severity.INFO]: window.createTextEditorDecorationType({
    backgroundColor: '#75acff20',
  }),
  [Severity.LOW]: window.createTextEditorDecorationType({
    backgroundColor: '#8cff7330',
  }),
  [Severity.MEDIUM]: window.createTextEditorDecorationType({
    backgroundColor: '#fff06b45',
  }),
  [Severity.HIGH]: window.createTextEditorDecorationType({
    backgroundColor: '#ffbc7035',
  }),
  [Severity.CRITICAL]: window.createTextEditorDecorationType({
    backgroundColor: '#ff757520',
  }),
}
