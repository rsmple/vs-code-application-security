export enum TriageStatus {
  RESOLVED = 0,
  UNVERIFIED = 1,
  VERIFIED = 2,
  ASSIGNED = 3,
  REJECTED = 4,
  TEMPORARILY = 5,
  PERMANENTLY = 6,
}

export const triageStatusTitleMap: Record<TriageStatus, string> = {
  [TriageStatus.UNVERIFIED]: 'Unverified',
  [TriageStatus.VERIFIED]: 'Verified',
  [TriageStatus.ASSIGNED]: 'Assigned',
  [TriageStatus.RESOLVED]: 'Resolved',
  [TriageStatus.REJECTED]: 'Rejected',
  [TriageStatus.TEMPORARILY]: 'Temporarily Risk Accepted',
  [TriageStatus.PERMANENTLY]: 'Permanently Risk Accepted',
}
