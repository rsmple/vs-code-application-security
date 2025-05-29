export enum TriageStatus {
  RESOLVED = 0,
  UNVERIFIED = 1,
  VERIFIED = 2,
  ASSIGNED = 3,
  REJECTED = 4,
  TEMPORARILY = 5,
  PERMANENTLY = 6,
}

export const triageStatusTitleMap = {
  [TriageStatus.UNVERIFIED]: 'Unverified',
  [TriageStatus.VERIFIED]: 'Verified',
  [TriageStatus.ASSIGNED]: 'Assigned',
  [TriageStatus.RESOLVED]: 'Resolved',
  [TriageStatus.REJECTED]: 'Rejected',
  [TriageStatus.TEMPORARILY]: 'Temporarily Risk Accepted',
  [TriageStatus.PERMANENTLY]: 'Permanently Risk Accepted',
} as const satisfies Record<TriageStatus, string>

export type TriageStatusTitle = typeof triageStatusTitleMap[keyof typeof triageStatusTitleMap]

export const triageStatusTitleMapReverse = Object.fromEntries(Object.entries(triageStatusTitleMap).map(item => [item[1], Number(item[0])])) as {
  [Key in keyof typeof triageStatusTitleMap as typeof triageStatusTitleMap[Key]]: Key
}

export const triageStatusList: TriageStatus[] & {length: UnionToTuple<TriageStatus>['length']} = [
  TriageStatus.UNVERIFIED,
  TriageStatus.VERIFIED,
  TriageStatus.ASSIGNED,
  TriageStatus.RESOLVED,
  TriageStatus.REJECTED,
  TriageStatus.TEMPORARILY,
  TriageStatus.PERMANENTLY,
]

export type TriageStatusEditable = TriageStatus.UNVERIFIED
  | TriageStatus.VERIFIED
  | TriageStatus.RESOLVED
  | TriageStatus.REJECTED
  | TriageStatus.TEMPORARILY
  | TriageStatus.PERMANENTLY
