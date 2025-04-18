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

export const severityChoiceMap: Record<string, Severity> = Object.fromEntries(Object.entries(severityTitleMap).map(item => [item[1], Number(item[0])]))

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

export const severityMarkdownMap: Record<Severity, string> = {
  [Severity.INFO]: '🔵',
  [Severity.LOW]: '🟢',
  [Severity.MEDIUM]: '🟡',
  [Severity.HIGH]: '🟠',
  [Severity.CRITICAL]: '🔴',
}
