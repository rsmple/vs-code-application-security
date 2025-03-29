import {Asset} from '@/models/Asset'
import {Finding} from '@/models/Finding'

import {context} from './Context'

export default {
  get repositoryUrl() {
    return context.workspaceState.get<string>('repositoryUrl')
  },
  set repositoryUrl(value: string | undefined) {
    context.workspaceState.update('repositoryUrl', value)
  },

  get asset() {
    return context.workspaceState.get<Asset>('asset')
  },
  set asset(value: Asset | undefined) {
    context.workspaceState.update('asset', value)
  },

  get findingList() {
    return context.workspaceState.get<Finding[]>('findingList') ?? []
  },
  set findingList(value: Finding[]) {
    context.workspaceState.update('findingList', value)
  },
}
