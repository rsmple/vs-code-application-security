export const PLUGIN_TITLE = 'Whitespots Application Security'

export enum CommandName {
  CHECK_FINDINGS = 'appsec.checkVulnerabilities',
  CONFIGURE = 'appsec.configure',
  SET_FILTER = 'appsec.setFilter',
  REJECT_FINDING = 'appsec.rejectFinding',
}

export enum ViewName {
  FINDINGS = 'appsec.findings'
}

const icon = './assets/appsec.svg'

export default {
  name: 'whitespots-application-security',
  displayName: PLUGIN_TITLE,
  icon,
  description: 'An extension to integrate with the Security Portal and display vulnerabilities related to the current repository.',
  version: '0.0.1',
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
          'appsec.base.token': {
            type: 'string',
            default: '',
            description: 'Auth API Token',
            order: 1,
          },
          'appsec.base.baseURL': {
            type: 'string',
            default: '',
            description: 'External Portal URL',
            order: 2,
          },
          'appsec.personalization.highlight': {
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