import {type Command, type Event, EventEmitter, Range, type TreeDataProvider, TreeItem, TreeItemCollapsibleState, Uri, window} from 'vscode'

import WorkspaceState from '@/utils/WorkspaceState'

import {type Finding, getFindingAbsolutePath} from '@/models/Finding'
import {severityTitleMap} from '@/models/Severity'
import {ViewName} from '@/package'

class TreeItemFinding extends TreeItem {
  constructor(
        public readonly list: Finding[],
        public readonly label: string,
        public readonly path: string | undefined,
        public readonly command?: Command,
        public readonly collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.None,
  ) {
    super(label, collapsibleState)
  }
}

const getCommandFindingOpen = (value: Finding): Command | undefined => {
  const filePath = getFindingAbsolutePath(value)

  if (filePath === null) return undefined

  const command: Command = {
    command: 'vscode.open',
    title: 'Open file',
    arguments: [Uri.file(filePath)],
  }

  if (value.line !== null) command.arguments?.push({selection: new Range(value.line - 1, 0, value.line - 1, 0)})

  return command
}

const expandedElements = new Set<string>()

class TreeDataProviderFinding implements TreeDataProvider<TreeItemFinding> {
  private _onDidChangeTreeData: EventEmitter<TreeItemFinding | undefined | void> = new EventEmitter<TreeItemFinding | undefined | void>()
  readonly onDidChangeTreeData: Event<TreeItemFinding | undefined | void> = this._onDidChangeTreeData.event

  public groupList: Record<string, Finding[]> = {}

  public updateList() {
    this.groupList = WorkspaceState.findingList.reduce<Record<string, Finding[]>>((result, current) => {
      if (current.file_path !== null) {
        if (!result[current.file_path]) result[current.file_path] = []

        result[current.file_path].push(current)
      }

      return result
    }, {})

    this.updateHeader()
  }

  public updateHeader() {
    const count = Object.values(this.groupList).reduce((result, current) => result + current.length, 0)

    setMessage(`Findings: ${ count } / ${ WorkspaceState.findingsCount }`)

    this._onDidChangeTreeData.fire()
  }

  getTreeItem(element: TreeItemFinding): TreeItem {
    return element
  }

  getChildren(element?: TreeItemFinding): TreeItemFinding[] {
    if (!element) {
      return Object.keys(this.groupList)
        .sort((a, b) => a > b ? 1 : a < b ? -1 : 0)
        .map(path => new TreeItemFinding(
          this.groupList[path],
          `${ this.groupList[path].length } - ${ path }`,
          path,
          undefined,
          expandedElements.has(path) ? TreeItemCollapsibleState.Expanded : TreeItemCollapsibleState.Collapsed,
        ))
    } else {
      return element.list.map(item => new TreeItemFinding(
        [],
        `L${ item.line } - ${ severityTitleMap[item.severity] } - ${ item.name }`,
        undefined,
        getCommandFindingOpen(item),
      ))
    }
  }
}

export const treeDataProviderFinding = new TreeDataProviderFinding()

const viewFindings = window.createTreeView(ViewName.FINDINGS, {
  treeDataProvider: treeDataProviderFinding,
})

viewFindings.onDidExpandElement(e => {
  if (e.element.path) expandedElements.add(e.element.path)
})

viewFindings.onDidCollapseElement(e => {
  if (e.element.path) expandedElements.delete(e.element.path)
})

let interval: NodeJS.Timeout | null = null

export const stopLoading = () => {
  if (interval) clearInterval(interval)
}

export const setLoading = () => {
  stopLoading()

  const message = 'Loading '
  let counter = 1

  interval = setInterval(() => {
    viewFindings.message = message + '.'.repeat(counter)
    if (counter < 3) counter++
    else counter = 1
  }, 300)
}

export const setMessage = (value: string) => {
  stopLoading()

  viewFindings.message = value
}

export const showErrorMessage = (text: string) => {
  window.showErrorMessage(text)

  setMessage(text)
}
