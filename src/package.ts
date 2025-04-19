export const PLUGIN_TITLE = 'Whitespots Application Security'

export const SETTINGS_KEY = 'appsec'

export const SETTINGS_KEY_CAP = SETTINGS_KEY[0].toLocaleUpperCase() + SETTINGS_KEY.slice(1)

export enum CommandName {
  CHECK_FINDINGS = `${ SETTINGS_KEY }.checkVulnerabilities`,
  CONFIGURE = `${ SETTINGS_KEY }.configure`,
  SET_FILTER = `${ SETTINGS_KEY }.setFilter`,
  REJECT_FINDING = `${ SETTINGS_KEY }.rejectFinding`,
}

export enum ViewName {
  FINDINGS = 'appsec.findings'
}

const logo = './assets/logo.png'
const icon = './assets/appsec.svg'

export default {
  name: 'whitespots-application-security',
  displayName: PLUGIN_TITLE,
  icon: logo,
  description: 'An extension to integrate with the Security Portal and display vulnerabilities related to the current repository.',
  engines: {
    vscode: '^1.97.0',
  },
  categories: [
    'Other',
  ],
  repository: {
    type: 'git',
    url: 'https://github.com/rsmple/vs-code-application-security',
  },
  bugs: {
    url: 'https://github.com/rsmple/vs-code-application-security/issues',
  },
  homepage: 'https://github.com/rsmple/vs-code-application-security',
  publisher: 'WhitespotsApplicationSecurityExtension',
  activationEvents: [],
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
    ],
    configuration: [
      {
        title: PLUGIN_TITLE,
        properties: {
          [`${ SETTINGS_KEY }.base.token`]: {
            type: 'string',
            default: '',
            description: 'Auth API Token',
            order: 1,
          },
          [`${ SETTINGS_KEY }.base.baseURL`]: {
            type: 'string',
            default: '',
            description: 'External Portal URL',
            order: 2,
          },
          [`${ SETTINGS_KEY }.personalization.highlight`]: {
            type: 'boolean',
            default: true,
            description: 'Enable vulnerability highlighting',
            order: 3,
          },
        },
      },
    ],
    viewsContainers: {
      activitybar: [
        {
          id: 'appsec',
          title: 'AppSec',
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
} as const