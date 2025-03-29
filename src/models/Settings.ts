import {context} from '@/utils/Context'

export type Settings = {
  token: string
  base_url: string
  vuln_highlighting_enabled: boolean
}

export interface SettingsMessage extends Settings {
  command: 'save_settings'
}

type SettingsPrefix = 'appsec'

type SettingsRawKey<Key extends keyof Settings = keyof Settings> = `${ SettingsPrefix }_${ Key }`

export const saveSettings = (settings: Settings) => {
  Object.entries(settings).forEach(([key, value]) => {
    context.globalState.update(`appsec_${ key as keyof Settings }` satisfies SettingsRawKey, value)
  })
}

export const getSavedSettings = (): Settings => {
  const settings: Settings = {
    base_url: '',
    token: '',
    vuln_highlighting_enabled: true,
  }

  Object.keys(settings).forEach((key) => {
    settings[key as keyof Settings] = context.globalState.get<Settings[keyof Settings]>(`appsec_${ key as keyof Settings }` satisfies SettingsRawKey) as never
      ?? settings[key as keyof Settings]
  })

  return settings as Settings
}
