import type {AssetField} from './Asset'
import type {CVSSVectorWithScore} from './CVSS'
import type {ProductLite} from './Product'

import {type Severity} from './Severity'
import {TriageStatus} from './TriageStatus'

export type FindingRelatedIssue = {
  url: string
  key: string
}

type FindingJira = {
  jira_sec_task_key: string
  jira_sec_task_status: string
  jira_sec_task_url: string
  jira_sec_task_assignee_name: string
  jira_sec_task_assignee_profile: string
  jira_sec_issue_components: string[]
  jira_sec_related_issues: FindingRelatedIssue[]

  jira_prod_task_key: string
  jira_prod_task_status: string
  jira_prod_task_url: string
  jira_prod_task_assignee_name: string
  jira_prod_task_assignee_profile: string
  jira_prod_issue_components: string[]
  jira_prod_related_issues: FindingRelatedIssue[]
}

export type Finding = {
  id: number
  name: string
  description: string
  dojo_finding_url: string
  file_path: string | null
  file_name: string
  line: number | null
  custom_field: string
  accept_duration_days: number
  accept_duration_days_remaining: number | null

  related_objects_meta: {
    affected_by_count: number
    product: ProductLite
    scanner: {
      name: string
    }
  }

  sla_days_remaining: number
  verify_days_remaining: never
  assign_days_remaining: never
  resolve_days_remaining: never

  product: number
  scanner: number
  image: string | null

  tags: string[]

  severity: Severity
  current_sla_level: TriageStatus

  sla_violated: boolean
  auto_resolved: boolean
  auto_rejected: boolean
  auto_verified: boolean
  auto_risk_accepted_perm: boolean
  auto_risk_accepted_temp: boolean

  date_created: string | null
  day_created: never
  date_verified: string | null
  date_resolved: string | null
  day_resolved: never
  date_rejected: string | null
  date_risk_accepted_perm: string | null
  date_risk_accepted_temp: string | null

  date_assignee_assigned: string | null
  date_sec_task_is_done: string | null
  date_prod_task_is_done: string | null

  sec_task_is_binded: boolean

  repo_url: string | null
  dependency: string | null
  vulnerable_url: string | null

  branch: string | null

  cvss?: CVSSVectorWithScore

  groups: string[]

  cwe_set: number[]
} & FindingJira & Record<AssetField, string>
