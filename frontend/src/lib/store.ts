import { create } from 'zustand'
import type { HistoryAction, TreeNode, Workspace } from './types'

type AppState = {
  rawTree: TreeNode | null
  selected: TreeNode | null
  search: string
  colorColumn: string
  workspace: Workspace
  history: HistoryAction[]
  historyIndex: number
  setRawTree: (tree: TreeNode | null) => void
  setSelected: (node: TreeNode | null) => void
  setSearch: (v: string) => void
  setColorColumn: (v: string) => void
  setWorkspace: (v: Workspace) => void
  toggleCollapse: (nodeId: string) => void
  undo: () => void
  redo: () => void
}

function cloneTree<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

function toggleCollapseById(node: TreeNode, nodeId: string): TreeNode {
  const copied = cloneTree(node)
  const walk = (n: TreeNode) => {
    if (n.id === nodeId && !n.is_leaf) n.collapsed = !n.collapsed
    n.children.forEach(walk)
  }
  walk(copied)
  return copied
}

export const useStore = create<AppState>((set, get) => ({
  rawTree: null,
  selected: null,
  search: '',
  colorColumn: '',
  workspace: 'analysis',
  history: [],
  historyIndex: -1,
  setRawTree: (rawTree) => set({ rawTree }),
  setSelected: (selected) => set({ selected }),
  setSearch: (value) => {
    const { history, historyIndex } = get()
    const next = [...history.slice(0, historyIndex + 1), { type: 'set_search', value } as HistoryAction]
    set({ search: value, history: next, historyIndex: next.length - 1 })
  },
  setColorColumn: (value) => {
    const { history, historyIndex } = get()
    const next = [...history.slice(0, historyIndex + 1), { type: 'set_color_column', value } as HistoryAction]
    set({ colorColumn: value, history: next, historyIndex: next.length - 1 })
  },
  setWorkspace: (value) => {
    const { history, historyIndex } = get()
    const next = [...history.slice(0, historyIndex + 1), { type: 'set_workspace', value } as HistoryAction]
    set({ workspace: value, history: next, historyIndex: next.length - 1 })
  },
  toggleCollapse: (nodeId) => {
    const { rawTree, history, historyIndex } = get()
    if (!rawTree) return
    const nextTree = toggleCollapseById(rawTree, nodeId)
    const next = [...history.slice(0, historyIndex + 1), { type: 'toggle_collapse', nodeId } as HistoryAction]
    set({ rawTree: nextTree, history: next, historyIndex: next.length - 1 })
  },
  undo: () => set((state) => ({ historyIndex: Math.max(-1, state.historyIndex - 1) })),
  redo: () => set((state) => ({ historyIndex: Math.min(state.history.length - 1, state.historyIndex + 1) })),
}))
