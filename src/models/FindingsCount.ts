import type {Severity} from './Severity'
import type {TriageStatus} from './TriageStatus'

export type FindingsCount<
  TR extends TriageStatus = TriageStatus.UNVERIFIED | TriageStatus.VERIFIED | TriageStatus.ASSIGNED | TriageStatus.RESOLVED,
  SE extends Severity = Severity,
> = {
  total: number
  by_triage_status: Record<TR, number>
  by_severity: Record<SE, number>
}
