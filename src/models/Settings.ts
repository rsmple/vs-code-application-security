import {workspace} from 'vscode'

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

export const SETTINGS_KEY = 'appsec'

export const getSettings = (): Settings => {
  return workspace.getConfiguration(SETTINGS_KEY) as unknown as Settings
}
