import type {FindingsCount} from './FindingsCount'

interface ProductFindingsCount extends FindingsCount {
  sla_violated: number
}

export type Product = {
  id: number
  name: string
  business_criticality: number
  business_criticality_updated: string

  product_type: number
  is_default: boolean

  tags: string[]
  push_tags_to_jira_tasks: boolean
  tag_jira_task_with_product_name: boolean

  wrt: number
  wrt_to_ra: number
  wrt_to_ra_per_product: number

  dojo_prod_id: number | null

  today_findings_percentage: number
  resolved_findings_percentage: number
  triaged_findings_percentage: number

  findings_count: ProductFindingsCount

  related_objects_meta: {
    product_type: {
      name: string
    }
  }
}

export type ProductLite = Pick<Product, 'id' | 'name' | 'business_criticality' | 'related_objects_meta' | 'is_default'>
