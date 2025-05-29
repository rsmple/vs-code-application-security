import {commands, window, workspace} from 'vscode'

import {CommandName, SETTINGS_KEY} from '@/package'

import {SeverityTitleEmoji} from './Severity'
import {TriageStatusTitle} from './TriageStatus'

export type Settings = {
  base: {
    token: string
    url: string
  }
  personalization: {
    highlight: boolean
  }
  filter: {
    triageStatuses: TriageStatusTitle[]
    severity: SeverityTitleEmoji[]
  }
}

export interface SettingsMessage extends Settings {
  command: 'save_settings'
}

export const getSettings = (): Settings => {
  return workspace.getConfiguration(SETTINGS_KEY) as unknown as Settings
}

export const getPortalUrl = (): string => {
  const url = getSettings().base.url

  return url.endsWith('/') ? url.slice(0, -1) : url
}

type SettingsSetup = Settings['base']

const isSettingsSetup = (value: unknown): value is SettingsSetup => {
  return value instanceof Object && Object.keys(value).length === 2
    && 'token' in value && typeof value.token === 'string'
    && 'url' in value && typeof value.url === 'string'
}

export const parseSettingsSetup = (value: Partial<SettingsSetup>): SettingsSetup | undefined => {
  const result: SettingsSetup = {
    token: value.token ?? '',
    url: value.url ?? '',
  }

  if (isSettingsSetup(result)) return result
}

export const setupSettings = (value: Settings['base']) => {
  workspace.getConfiguration(SETTINGS_KEY).update('base.token', value.token, true) 
  workspace.getConfiguration(SETTINGS_KEY).update('base.url', value.url, true)

  window.showInformationMessage('Settings have been successfully applied')

  setTimeout(() => {
    commands.executeCommand(CommandName.CHECK_FINDINGS)
  }, 200)
}