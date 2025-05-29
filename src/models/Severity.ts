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

export const severityTitleMap = {
  [Severity.CRITICAL]: 'Critical',
  [Severity.HIGH]: 'High',
  [Severity.MEDIUM]: 'Meduim',
  [Severity.LOW]: 'Low',
  [Severity.INFO]: 'Info',
} as const satisfies Record<Severity, string>

export const severityEmojiMap = {
  [Severity.CRITICAL]: '🔴',
  [Severity.HIGH]: '🟠',
  [Severity.MEDIUM]: '🟡',
  [Severity.LOW]: '🟢',
  [Severity.INFO]: '🔵',
} as const satisfies Record<Severity, string>

export const severityTitleEmojiMap = severityList.reduce((result, item) => {
  result[item] = `${ severityEmojiMap[item] } ${ severityTitleMap[item] }` as never
  return result
}, {} as {[Key in Severity]: `${ typeof severityEmojiMap[Key] } ${ typeof severityTitleMap[Key] }`})

export type SeverityTitleEmoji = typeof severityTitleEmojiMap[Severity]

export const severityTitleEmojiMapReverse = Object.fromEntries(Object.entries(severityTitleEmojiMap).map(item => [item[1], Number(item[0])])) as {
  [Key in keyof typeof severityTitleEmojiMap as typeof severityTitleEmojiMap[Key]]: Key
}
