import { create } from 'zustand'
import type { TreeNode, ToolMode, UiState, ViewState } from './types'

type Snapshot = {
  tree: TreeNode | null
  selected: TreeNode | null
  view: ViewState
  ui: UiState
}

type Store = Snapshot & {
  past: Snapshot[]
  future: Snapshot[]
  setTree: (t: TreeNode) => void
  setSelected: (n: TreeNode | null) => void
  setSearch: (s: string) => void
  setColorColumn: (c: string) => void
  setTool: (t: ToolMode) => void
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  toggleCollapsed: (nodeId: string) => void
  undo: () => void
  redo: () => void
}

const cloneTree = (node: TreeNode): TreeNode => ({ ...node, children: node.children.map(cloneTree) })

const snapshotOf = (s: Store): Snapshot => ({
  tree: s.tree ? cloneTree(s.tree) : null,
  selected: s.selected ? { ...s.selected } : null,
  view: { ...s.view },
  ui: { ...s.ui },
})

const updateTreeNode = (node: TreeNode, nodeId: string): TreeNode => {
  if (node.id === nodeId) return { ...node, collapsed: !node.collapsed }
  return { ...node, children: node.children.map((c) => updateTreeNode(c, nodeId)) }
}

export const useStore = create<Store>((set, get) => ({
  tree: null,
  selected: null,
  view: { search: '', colorColumn: '', tool: 'select' },
  ui: { leftPanelOpen: true, rightPanelOpen: true },
  past: [],
  future: [],
  setTree: (tree) => set((s) => ({ past: [...s.past, snapshotOf(s)], future: [], tree })),
  setSelected: (selected) => set({ selected }),
  setSearch: (search) => set((s) => ({ past: [...s.past, snapshotOf(s)], future: [], view: { ...s.view, search } })),
  setColorColumn: (colorColumn) => set((s) => ({ past: [...s.past, snapshotOf(s)], future: [], view: { ...s.view, colorColumn } })),
  setTool: (tool) => set((s) => ({ view: { ...s.view, tool } })),
  toggleLeftPanel: () => set((s) => ({ ui: { ...s.ui, leftPanelOpen: !s.ui.leftPanelOpen } })),
  toggleRightPanel: () => set((s) => ({ ui: { ...s.ui, rightPanelOpen: !s.ui.rightPanelOpen } })),
  toggleCollapsed: (nodeId) => set((s) => {
    if (!s.tree) return s
    return { past: [...s.past, snapshotOf(s)], future: [], tree: updateTreeNode(s.tree, nodeId) }
  }),
  undo: () => set((s) => {
    if (s.past.length === 0) return s
    const prev = s.past[s.past.length - 1]
    const now = snapshotOf(s)
    return { ...s, ...prev, past: s.past.slice(0, -1), future: [now, ...s.future] }
  }),
  redo: () => set((s) => {
    if (s.future.length === 0) return s
    const next = s.future[0]
    const now = snapshotOf(s)
    return { ...s, ...next, past: [...s.past, now], future: s.future.slice(1) }
  }),
}))
