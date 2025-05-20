import type {Settings} from '@/models/Settings'

export const PLUGIN_TITLE = 'Whitespots Application Security Portal'

export const SETTINGS_KEY = 'portal'

export const SETTINGS_KEY_CAP = SETTINGS_KEY[0].toLocaleUpperCase() + SETTINGS_KEY.slice(1)

export enum CommandName {
  CHECK_FINDINGS = `${ SETTINGS_KEY }.checkVulnerabilities`,
  CONFIGURE = `${ SETTINGS_KEY }.configure`,
  SET_FILTER = `${ SETTINGS_KEY }.setFilter`,
  REJECT_FINDING = `${ SETTINGS_KEY }.rejectFinding`,
  SETUP = `${ SETTINGS_KEY }.setup`,
}

export enum ViewName {
  FINDINGS = `${ SETTINGS_KEY }.findings`
}

const logo = './assets/logo.png'
const icon = './assets/appsec.svg'

type SettingsKeys = ObjectPaths<Settings, string | boolean | number>

type SettingsSchema = {
  [Key in keyof SettingsKeys as `${ typeof SETTINGS_KEY }.${ Key }`]: {
    type: string
    default: SettingsKeys[Key]
    description: string
    order: number
  }
}

export default {
  name: 'whitespots-application-security',
  displayName: PLUGIN_TITLE,
  icon: logo,
  description: 'An extension to integrate with the Security Portal and display vulnerabilities related to the current repository.',
  engines: {
    vscode: '^1.75.0',
  },
  categories: [
    'Other',
  ],
  repository: {
    type: 'git',
    url: 'https://github.com/Whitespots-OU/vscode-portal-extension',
  },
  bugs: {
    url: 'https://github.com/Whitespots-OU/vscode-portal-extension/issues',
  },
  homepage: 'https://github.com/Whitespots-OU/vscode-portal-extension',
  publisher: 'Whitespots',
  activationEvents: [
    'onUri',
    `onCommand:${ CommandName.SETUP }`,
  ],
  main: './extension.cjs',
  contributes: {
    commands: [
      {
        command: CommandName.CHECK_FINDINGS,
        title: 'Check vulnerabilities',
        icon: '$(refresh)',
      },
      {
        command: CommandName.CONFIGURE,
        title: 'Settings',
        icon: '$(settings-gear)',
      },
      {
        command: CommandName.SET_FILTER,
        title: 'Findings Filter',
        icon: '$(filter)',
      },
      {
        command: CommandName.REJECT_FINDING,
        title: 'Reject Finding',
      },
      {
        command: CommandName.SETUP,
        title: 'Setup',
      },
    ],
    configuration: [
      {
        title: PLUGIN_TITLE,
        properties: {
          'portal.base.url': {
            type: 'string',
            default: '',
            description: 'External Portal URL',
            order: 1,
          },
          'portal.base.token': {
            type: 'string',
            default: '',
            description: 'Auth API Token',
            order: 2,
          },
          'portal.personalization.highlight': {
            type: 'boolean',
            default: true,
            description: 'Enable vulnerability highlighting',
            order: 3,
          },
        } satisfies SettingsSchema,
      },
    ],
    viewsContainers: {
      activitybar: [
        {
          id: 'appsec',
          title: SETTINGS_KEY_CAP,
          icon,
        },
      ],
    },
    views: {
      appsec: [
        {
          id: ViewName.FINDINGS,
          name: 'Findings',
          icon,
        },
      ],
    },
    menus: {
      'view/title': [
        {
          command: CommandName.SET_FILTER,
          when: `view == ${ ViewName.FINDINGS }`,
          group: 'navigation',
        },
        {
          command: CommandName.CONFIGURE,
          when: `view == ${ ViewName.FINDINGS }`,
          group: 'navigation',
        },
        {
          command: CommandName.CHECK_FINDINGS,
          when: `view == ${  ViewName.FINDINGS }`,
          group: 'navigation',
        },
      ],
    },
  },
  capabilities: {
    virtualWorkspaces: true,
    untrustedWorkspaces: {
      supported: true,
    },
    uriHandler: true,
  },
} as const