import type {Settings} from '@ext/models/Settings'

import {severityList, severityTitleEmojiMap} from '@/models/Severity'
import {TriageStatus, triageStatusList, triageStatusTitleMap} from '@/models/TriageStatus'

export const PLUGIN_TITLE = 'Whitespots Application Security Portal'

export const SETTINGS_KEY = 'portal'

export const SETTINGS_KEY_CAP = SETTINGS_KEY[0].toLocaleUpperCase() + SETTINGS_KEY.slice(1)

export enum CommandName {
  CHECK_FINDINGS = `${ SETTINGS_KEY }.checkVulnerabilities`,
  CONFIGURE = `${ SETTINGS_KEY }.configure`,
  REJECT_FINDING = `${ SETTINGS_KEY }.rejectFinding`,
  SETUP = `${ SETTINGS_KEY }.setup`,
}

export enum ViewName {
  FINDINGS = `${ SETTINGS_KEY }.findings`,
  WEBVIEW = `${ SETTINGS_KEY }.webview`,
}

const logo = './assets/logo.png'
const icon = './assets/appsec.svg'

type SettingsKeys = ObjectPaths<Settings, string | boolean | number | unknown[]>

type SettingsSchema = {
  [Key in keyof SettingsKeys as `${ typeof SETTINGS_KEY }.${ Key }`]: {
    type: string
    default: SettingsKeys[Key]
    description: string
    order: number
    enum?: unknown
    items?: unknown
  }
}

let order = 1

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
    `onView:${ ViewName.WEBVIEW }`,
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
            order: order++,
          },
          'portal.base.token': {
            type: 'string',
            default: '',
            description: 'Auth API Token',
            order: order++,
          },
          'portal.personalization.highlight': {
            type: 'boolean',
            default: true,
            description: 'Enable vulnerability highlighting',
            order: order++,
          },
          'portal.filter.maxFindings': {
            type: 'number',
            default: 100,
            description: 'Maximum number of findings to display in the list.',
            order: order++,
            enum: [50, 100, 200],
          },
          'portal.filter.triageStatuses': {
            type: 'array',
            description: 'List of triage status to show findings',
            default: [
              triageStatusTitleMap[TriageStatus.VERIFIED],
              triageStatusTitleMap[TriageStatus.ASSIGNED],
            ],
            order: order++,
            items: {
              type: 'string',
              enum: triageStatusList.map(item => triageStatusTitleMap[item]),
              enumDescriptions: triageStatusList,
            },
          },
          'portal.filter.severity': {
            type: 'array',
            description: 'List of severities to show findings',
            default: severityList.map(item => severityTitleEmojiMap[item]),
            order: order++,
            items: {
              type: 'string',
              enum: severityList.map(item => severityTitleEmojiMap[item]),
              enumDescriptions: severityList,
            },
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
      secondarySideBar: [
        {
          id: 'webview',
          title: 'Chat',
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
      secondarySideBar: [
        {
          id: ViewName.WEBVIEW,
          name: 'Webview',
        },
      ],
    },
    menus: {
      'view/title': [
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