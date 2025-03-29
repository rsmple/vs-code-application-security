import {outputChannel} from '@/utils/OutputChannel'
import {workspace, type WorkspaceConfiguration} from 'vscode'

export type Settings = {
  base: {
    token: string
    baseURL: string
  },
  personalization: {
    highlight: boolean
  }
}

export interface SettingsMessage extends Settings {
  command: 'save_settings'
}

export const SETTINGS = 'appsec'

export const getSavedSettings = (): Settings => {
  return workspace.getConfiguration(SETTINGS) as unknown as Settings;
}
