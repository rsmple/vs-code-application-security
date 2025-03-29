export enum Severity {
  CRITICAL = 4,
  HUGH = 3,
  MEDIUM = 2,
  LOW = 1,
  INFO = 0,
}

export const severityTitleMap: Record<Severity, string> = {
  [Severity.CRITICAL]: 'Critical',
  [Severity.HUGH]: 'High',
  [Severity.MEDIUM]: 'Meduim',
  [Severity.LOW]: 'Low',
  [Severity.INFO]: 'Info',
}
