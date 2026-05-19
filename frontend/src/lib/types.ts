export type TreeNode = {
  id: string
  name: string
  branch_length: number | null
  children: TreeNode[]
  is_leaf: boolean
  metadata?: Record<string, unknown> | null
  collapsed: boolean
}

export type ToolMode = 'select' | 'pan' | 'zoom'

export type ViewState = {
  search: string
  colorColumn: string
  tool: ToolMode
}

export type UiState = {
  leftPanelOpen: boolean
  rightPanelOpen: boolean
}
