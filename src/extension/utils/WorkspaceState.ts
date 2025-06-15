import type {Asset} from '@/models/Asset'
import type {FindingExtended} from '@ext/models/Finding'

import {context} from './Context'

export default {
  get repositoryUrl() {
    return context.workspaceState.get<string>('repositoryUrl')
  },
  set repositoryUrl(value: string | undefined) {
    context.workspaceState.update('repositoryUrl', value)
  },

  get assetList() {
    return context.workspaceState.get<Asset[]>('assetList') ?? []
  },
  set assetList(value: Asset[]) {
    context.workspaceState.update('assetList', value)
  },

  get findingList() {
    return context.workspaceState.get<FindingExtended[]>('findingList') ?? []
  },
  set findingList(value: FindingExtended[]) {
    context.workspaceState.update('findingList', value)
  },

  get findingsCount() {
    return context.workspaceState.get<number>('findingsCount') ?? 0
  },
  set findingsCount(value: number) {
    context.workspaceState.update('findingsCount', value)
  },
}
