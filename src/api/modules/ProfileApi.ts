import type {User} from '@/models/User'

import {apiClient} from '@/api/ApiClient'

export default {
  getItem() {
    return apiClient.get<User>('/profile/')
  },
}
