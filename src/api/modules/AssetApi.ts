import type {Asset, AssetType} from '@/models/Asset'

import {apiClient} from '@/api/ApiClient'

export type QueryParamsAssetList = {
  id__in?: number[]
  id__not_in?: number[]
  slice_indexes?: number[]

  search?: string
  ordering?: string
  page?: number

  asset_type?: AssetType
  product?: number
  tags__name__in?: string

  product__in?: number[]
  product__not_in?: number[]
  product__product_type__in?: number[]

  product__business_criticality__gte?: string
  product__business_criticality__lte?: string
}

export default {
  getList(params: QueryParamsAssetList) {
    return apiClient.get<PaginatedResponse<Asset>>('/product-assets/', {params})
  },

  getItem(id: number) {
    return apiClient.get<PaginatedResponse<Asset>>(`/product-assets/${ id }/`)
  },
}
