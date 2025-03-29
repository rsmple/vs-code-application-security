import {type TextEditorDecorationType, window} from 'vscode'

export enum Severity {
  CRITICAL = 4,
  HIGH = 3,
  MEDIUM = 2,
  LOW = 1,
  INFO = 0,
}

export const severityList: Severity[] = [
  Severity.CRITICAL,
  Severity.HIGH,
  Severity.MEDIUM,
  Severity.LOW,
  Severity.INFO,
]

export const severityTitleMap: Record<Severity, string> = {
  [Severity.CRITICAL]: 'Critical',
  [Severity.HIGH]: 'High',
  [Severity.MEDIUM]: 'Meduim',
  [Severity.LOW]: 'Low',
  [Severity.INFO]: 'Info',
}

export const severityChoiceMap: Record<string, Severity> = Object.fromEntries(Object.entries(severityTitleMap).map(item => item.reverse()))

export const severityDecorationMap: Record<Severity, TextEditorDecorationType> = {
  [Severity.INFO]: window.createTextEditorDecorationType({
    backgroundColor: 'rgba(0, 0, 255, 0.2)',
  }),
  [Severity.LOW]: window.createTextEditorDecorationType({
    backgroundColor: 'rgba(0, 255, 0, 0.2)',
  }),
  [Severity.MEDIUM]: window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 255, 0, 0.2)',
  }),
  [Severity.HIGH]: window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 165, 0, 0.2)',
  }),
  [Severity.CRITICAL]: window.createTextEditorDecorationType({
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    border: '1px solid red',
  }),
}
