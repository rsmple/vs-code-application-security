import type {Finding} from '@/models/Finding'

import {MarkdownString, workspace} from 'vscode'

import {dateFormat} from 'eco-vue-js/dist/utils/dateTime'

import {join} from 'path'

import {severityEmojiMap, severityTitleMap} from '@/models/Severity'
import {TriageStatus, triageStatusTitleMap} from '@/models/TriageStatus'
import {getPortalUrl} from '@ext/models/Settings'
import {CommandName} from '@ext/package'

export type FindingExtended = Finding & {
  line_text: string
  language: string | undefined
}

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

export const getFindingHoverMessage = (value: FindingExtended, outdated: boolean, prefix: string = '') => {
  const hoverMessage = new MarkdownString()

  const url = `[${ value.id }](${ getPortalUrl() }/products/${ value.product }/findings/${ value.id })`

  hoverMessage.appendMarkdown(`## ${ prefix }${ url }: ${ severityEmojiMap[value.severity] } ${ severityTitleMap[value.severity] } - ${ value.name }${ outdated ? ' (possibly outdated)' : '' }\n\n`)

  if (value.current_sla_level !== TriageStatus.REJECTED) {
    const rejectUri = `command:${ CommandName.REJECT_FINDING }?${ encodeURIComponent(JSON.stringify(value.id)) }`
    hoverMessage.appendMarkdown(`[Reject this finding](${ rejectUri })\n\n`)
  }

  hoverMessage.isTrusted = true

  hoverMessage.appendMarkdown(`${ value.file_path }:${ value.line }\n\n`)

  hoverMessage.appendMarkdown('Code snippet:\n\n')

  hoverMessage.appendCodeblock(value.line_text, value.language)

  hoverMessage.appendMarkdown(value.description)

  hoverMessage.appendMarkdown('\n\n')

  findingFieldDetailList.forEach((field, index, array) => {
    hoverMessage.appendMarkdown(findingFieldTitleMap[field] + ': ' + findingFieldGetterMap[field](value) + (index < array.length - 1 ? '\n\n' : ''))
  })

  return hoverMessage
}

export const getFindingAbsolutePath = (value: Finding): string | null => {
  if (!workspace.workspaceFolders || value.file_path === null) return null

  return join(workspace.workspaceFolders[0].uri.fsPath, value.file_path)
}