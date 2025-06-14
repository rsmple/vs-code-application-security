import {window} from 'vscode'

import {PLUGIN_TITLE} from '@ext/package'

export const outputChannel = window.createOutputChannel(PLUGIN_TITLE)
