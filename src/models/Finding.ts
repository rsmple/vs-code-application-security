import type {AssetField} from './Asset'
import type {CVSSVectorWithScore} from './CVSS'
import type {ProductLite} from './Product'

import {MarkdownString, workspace} from 'vscode'

import {dateFormat} from 'eco-vue-js/dist/utils/dateTime'

import {join} from 'path'

import {getPortalUrl} from './Settings'
import {type Severity, severityMarkdownMap, severityTitleMap} from './Severity'
import {type TriageStatus, triageStatusTitleMap} from './TriageStatus'

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

type FindingExtend = {
  line_text: string
  language: string | undefined
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
} & FindingJira & Record<AssetField, string> & FindingExtend

const findingFieldTitleMap = {
  id: 'ID',
  current_sla_level: 'Status',
  cvss: 'CVSS',
  date_created: 'Created',
  date_verified: 'Verified',
} as const satisfies Partial<Record<keyof Finding, string>>

const findingFieldDetailList: (keyof typeof findingFieldTitleMap)[] = [
  'current_sla_level',
  'cvss',
  'date_verified',
]

const findingFieldGetterMap = {
  id: value => value.id.toString(),
  current_sla_level: value => triageStatusTitleMap[value.current_sla_level],
  cvss: value => value.cvss?.['4.0']?.score?.toString() ?? value.cvss?.['3.1']?.score?.toString() ?? 'N / A',
  date_created: value => value.date_created ? dateFormat(new Date(value.date_created)) : 'N / A',
  date_verified: value => value.date_verified ? dateFormat(new Date(value.date_verified)) : 'N / A',
} as const satisfies Partial<Record<keyof Finding, (value: Finding) => string>>

export const getFindingHoverMessage = (value: Finding, outdated: boolean) => {
  const hoverMessage = new MarkdownString()

  hoverMessage.appendMarkdown(`## ${ severityMarkdownMap[value.severity] } ${ severityTitleMap[value.severity] }${ outdated ? ' (possibly outdated)' : '' }\n\n`)

  hoverMessage.appendMarkdown(`[${ value.id }](${ getPortalUrl() }/products/${ value.product }/findings/${ value.id }): ${ value.name }\n\n`)

  hoverMessage.appendMarkdown(`${ value.file_path }:${ value.line }\n\n`)

  hoverMessage.appendMarkdown('Code snippet:\n\n')

  hoverMessage.appendCodeblock(value.line_text, value.language)

  hoverMessage.appendMarkdown(value.description)

  findingFieldDetailList.forEach((field, index, array) => {
    hoverMessage.appendMarkdown(findingFieldTitleMap[field] + ': ' + findingFieldGetterMap[field](value) + (index < array.length - 1 ? '\n\n' : ''))
  })

  return hoverMessage
}

export const getFindingAbsolutePath = (value: Finding): string | null => {
  if (!workspace.workspaceFolders || value.file_path === null) return null

  return join(workspace.workspaceFolders[0].uri.fsPath, value.file_path)
}