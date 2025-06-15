import type {User} from '@/models/User'

import {apiClient} from '../ApiClient'

export default {
  getItem() {
    return apiClient.get<User>('/profile/')
  },
}
