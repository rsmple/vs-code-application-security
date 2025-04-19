import {workspace} from 'vscode'

import {SETTINGS_KEY} from '@/package'

export type Settings = {
  base: {
    token: string
    baseURL: string
  }
  personalization: {
    highlight: boolean
  }
}

export interface SettingsMessage extends Settings {
  command: 'save_settings'
}

export const getSettings = (): Settings => {
  return workspace.getConfiguration(SETTINGS_KEY) as unknown as Settings
}

export const getPortalUrl = (): string => {
  const url = getSettings().base.baseURL

  return url.endsWith('/') ? url.slice(0, -1) : url
}
