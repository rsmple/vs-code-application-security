import type {Severity} from './Severity'

export type CVSSCategory = {
  title: string
  version: '3.1' | '4.0'
  metrics: CVSSMetric[]
  helptext: string
}

export type CVSSMetric = {
  title: string
  abbreviation: string
  order: number
  values: CVSSMetricValue[]
  subcategory: string
  helptext: string
}

export type CVSSMetricValue = {
  title: string
  abbreviation: string
  helptext: string
}

export type CVSSVectorWithScore = Record<CVSSCategory['version'], {
  vector: string
} & CVSSVectorScore>

export type CVSSSettings = {
  is_active: boolean
  launch_frequency: number
}

export type CVSSVectorScore = {
  score: number | null
  severity: Severity | null
  detail?: string
}
