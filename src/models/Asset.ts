import type {JobSequence} from './JobSequence'
import type {ProductLite} from './Product'

export enum AssetType {
  REPOSITORY = 0,
  DOCKER_IMAGE = 1,
  DOMAIN = 2,
  HOST = 3,
  CLOUD = 4,
}

export interface AssetFieldMap extends Record<AssetType, string> {
  [AssetType.REPOSITORY]: 'repository'
  [AssetType.DOCKER_IMAGE]: 'docker_image'
  [AssetType.DOMAIN]: 'domain'
  [AssetType.HOST]: 'host'
  [AssetType.CLOUD]: 'cloud_account'
}

export type AssetField = AssetFieldMap[keyof AssetFieldMap]

export type Asset = {
  id: number
  value: string
  asset_type: AssetType
  repository_url_config: number | null
  product: number
  tags: string[]
  job_sequence: number | null
  cloud_key_id?: string
  cloud_key_secret?: string

  unverified_findings_count?: number
  verified_and_assigned_findings_count?: number

  related_objects_meta?: {
    product: ProductLite
    job_sequence: JobSequence | null
  }
}