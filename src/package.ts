export const PLUGIN_TITLE = 'Whitespots Application Security'

export enum CommandName {
  CHECK_FINDINGS = 'checkVulnerabilities',
  CONFIGURE = 'configure',
  SET_FILTER = 'setFilter',
  FINDING_DETAILS = 'findingDetails',
  SET_VIEW_MODE = 'setViewMode',
}

export enum ViewName {
  FINDINGS = 'findings'
}

export default {
  name: 'whitespots-application-security',
  displayName: PLUGIN_TITLE,
  description: '',
  version: '0.0.1',
  engines: {
    vscode: '^1.97.0',
  },
  categories: [
    'Other',
  ],
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
      },
      {
        command: CommandName.FINDING_DETAILS,
        title: 'Finding details',
      },
      {
        command: CommandName.SET_VIEW_MODE,
        title: 'Set view mode',
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
          icon: '../assets/appsec.svg',
        },
      ],
    },
    views: {
      appsec: [
        {
          id: ViewName.FINDINGS,
          name: 'Findings',
          icon: '../assets/appsec.svg',
        },
      ],
    },
    menus: {
      'view/title': [
        {
          command: CommandName.SET_VIEW_MODE,
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