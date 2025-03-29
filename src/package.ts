export const PLUGIN_TITLE = 'Whitespots Application Security'

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
        command: 'appsec.checkVulnerabilities',
        title: 'Проверить уязвимости',
      },
      {
        command: 'appsec.configure',
        title: 'AppSec: Настроить',
      },
      {
        command: 'appsecVulnerabilities.setFilter',
        title: 'Фильтр уязвимостей',
      },
      {
        command: 'appsec.showDetails',
        title: 'Подробности уязвимостей',
      },
      {
        command: 'appsec.setViewMode',
        title: 'Подробности уязвимостей',
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
          id: 'appsecVulnerabilities',
          name: 'Уязвимости',
          icon: '../assets/appsec.svg',
        },
      ],
    },
    menus: {
      'view/title': [
        {
          command: 'appsec.configure',
          when: 'view == appsecVulnerabilities',
          group: 'navigation',
        },
        {
          command: 'appsec.setViewMode',
          when: 'view == appsecVulnerabilities',
          group: 'navigation',
        },
        {
          command: 'appsec.checkVulnerabilities',
          when: 'view == appsecVulnerabilities',
          group: 'navigation',
        },
      ],
    },
  },
} as const