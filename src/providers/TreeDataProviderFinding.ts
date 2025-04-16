import {type Command, type Event, EventEmitter, Range, type TreeDataProvider, TreeItem, TreeItemCollapsibleState, Uri, window} from 'vscode'

import WorkspaceState from '@/utils/WorkspaceState'

import {type Finding, getFindingAbsolutePath} from '@/models/Finding'
import {Severity, severityTitleMap} from '@/models/Severity'
import {ViewName} from '@/package'

class TreeItemFinding extends TreeItem {
  constructor(
        public readonly list: Finding[],
        public readonly label: string,
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

  if (value.line !== null) command.arguments?.push({selection: new Range(value.line, 0, value.line, 0)})

  return command
}

class TreeDataProviderFinding implements TreeDataProvider<TreeItemFinding> {
  private _onDidChangeTreeData: EventEmitter<TreeItemFinding | undefined | void> = new EventEmitter<TreeItemFinding | undefined | void>()
  readonly onDidChangeTreeData: Event<TreeItemFinding | undefined | void> = this._onDidChangeTreeData.event

  private groupList: Record<string, Finding[]> = {}
  private severityFilter: Severity | null = null

  public updateList() {
    this.groupList = WorkspaceState.findingList.reduce<Record<string, Finding[]>>((result, current) => {
      if (current.file_path !== null) {
        if (!result[current.file_path]) result[current.file_path] = []

        result[current.file_path].push(current)
      }
      return result
    }, {})
    this._onDidChangeTreeData.fire()
  }

  public setFilter(severity: Severity | null) {
    this.severityFilter = severity
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
          `${ path } - ${ this.groupList[path].length }`,
          undefined,
          TreeItemCollapsibleState.Collapsed,
        ))
    } else {
      return element.list.map(item => new TreeItemFinding(
        [],
        severityTitleMap[item.severity] + (item.line !== null ? ` - Line ${ item.line }` : ''),
        getCommandFindingOpen(item),
      ))
    }
  }
}

export const treeDataProviderFinding = new TreeDataProviderFinding()

export const viewFindings = window.createTreeView(ViewName.FINDINGS, {
  treeDataProvider: treeDataProviderFinding,
})
