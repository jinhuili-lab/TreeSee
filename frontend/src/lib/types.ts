export type TreeNode = {
  id: string
  name: string
  branch_length: number | null
  children: TreeNode[]
  is_leaf: boolean
  metadata?: Record<string, unknown> | null
  collapsed: boolean
}

export type Workspace = 'analysis' | 'publication'

export type HistoryAction =
  | { type: 'set_search'; value: string }
  | { type: 'set_color_column'; value: string }
  | { type: 'toggle_collapse'; nodeId: string }
  | { type: 'set_workspace'; value: Workspace }
