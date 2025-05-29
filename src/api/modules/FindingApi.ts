import type {AssetType} from '@/models/Asset'
import type {Finding} from '@/models/Finding'
import type {Severity} from '@/models/Severity'
import type {Tag} from '@/models/Tag'
import type {TriageStatus, TriageStatusEditable} from '@/models/TriageStatus'

import {apiClient} from '@/api/ApiClient'

export enum AffectedByContentTypeModel {
  CVSS_RULE = 'cvssrule',
  AUTOVALUDATOR_RULE = 'autovalidatorrule',
  SCANNER = 'scanner',
  AUDIT = 'audit',
}

export type QueryParamsFindings = {
  search?: string
  search_fields?: string
  ordering?: string
  page?: number

  product?: number
  triage_status?: TriageStatus
  triage_status__in?: TriageStatus[]

  date_created_from?: string
  date_created_to?: string

  date_verified_from?: string
  date_verified_to?: string

  date_assignee_assigned_from?: string
  date_assignee_assigned_to?: string

  date_resolved_from?: string
  date_resolved_to?: string

  verify_violated?: string
  assign_violated?: string
  resolve_violated?: string

  severity__in?: Severity[]

  tags__name__in?: string
  tags__name__exact_in?: string
  tags__name__at_least_in?: string
  tags__name__not_in?: string

  asset__tags__in?: string
  product__tags__name__in?: string

  scanner__in?: string
  scanner__not_in?: string
  dependency__icontains?: string
  vulnerable_url__icontains?: string
  branch__icontains?: string
  branch__exclude?: string
  branch__isempty?: 'true' | 'false'
  file_path__icontains?: string
  line?: string
  custom_field__icontains?: string
  dojo_finding_id__isnull?: 'true' | 'false'

  repository__icontains?: string
  docker_image__icontains?: string
  domain__icontains?: string
  host__icontains?: string
  cloud_account__icontains?: string

  assets__in?: Partial<Record<AssetType, string[]>>

  product__in?: number[]
  product__not_in?: number[]
  product__product_type__in?: string

  product__business_criticality__gte?: string
  product__business_criticality__lte?: string

  product_search?: string
  cwe_search?: string

  auto_resolved?: 'true'
  auto_rejected?: 'true'
  auto_verified?: 'true'
  affected_by__content_type__model?: AffectedByContentTypeModel
  affected_by__object_id?: number

  groups__id__in?: string
  groups__name__in?: string

  cwes__in?: number[]
  cwes__not_in?: number[]
  cwes__not_null?: 'true'

  id__in?: number[]
  id__not_in?: number[]

  slice_indexes?: number[]

  compare_with?: number
}

export type SetStatusPayload = Pick<Finding, 'accept_duration_days'>

export default {
  getList(params: QueryParamsFindings) {
    return apiClient.get<PaginatedResponse<Finding>>('/findings/', {params})
  },

  setStatus(id: number, status: TriageStatusEditable, payload: SetStatusPayload | undefined) {
    return apiClient.post<Finding>(`/findings/${ id }/set-status/${ status }/`, payload)
  },

  addTag(id: number, tag: Partial<Tag>) {
    return apiClient.post<Finding>(`/findings/${ id }/tags/add/`, tag)
  },

  removeTag(id: number, tag: Partial<Tag>) {
    return apiClient.post<Finding>(`/findings/${ id }/tags/remove/`, tag)
  },
}
