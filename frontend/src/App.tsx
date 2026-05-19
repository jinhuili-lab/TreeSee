import { useEffect, useRef, useState } from 'react'
import TreeView from './components/TreeView'
import { useStore } from './lib/store'
import type { ColorScope } from './lib/types'

const API = 'http://localhost:8000'
const APP_VERSION = '0.3.0-mvp'

type TopMenu = 'file' | 'edit' | 'about' | null

type PanelState = {
  radialMode: boolean
  showLeafLabels: boolean
  showBranchLength: boolean
  showLegend: boolean
  branchThickness: number
  labelSize: number
  alignLabels: boolean
  showMetadataStrip: boolean
  metadataStripWidth: number
  collapseDepth: number
  searchCaseSensitive: boolean
}

const defaultPanelState: PanelState = {
  radialMode: false,
  showLeafLabels: true,
  showBranchLength: false,
  showLegend: true,
  branchThickness: 1.5,
  labelSize: 12,
  alignLabels: true,
  showMetadataStrip: true,
  metadataStripWidth: 12,
  collapseDepth: 0,
  searchCaseSensitive: false,
}

export default function App() {
  const { rawTree, setRawTree, selected, search, setSearch, undo, redo, workspace, setWorkspace, applyManualColor, clearManualColors } = useStore()
  const [msg, setMsg] = useState('')
  const [openMenu, setOpenMenu] = useState<TopMenu>(null)
  const [panel, setPanel] = useState<PanelState>(defaultPanelState)
  const [paintColor, setPaintColor] = useState('#ef4444')
  const [paintScope, setPaintScope] = useState<ColorScope>('node')
  const menuWrapRef = useRef<HTMLDivElement>(null)

  const parseTreeFile = async (file: File | Blob, filename: string) => {
    const fd = new FormData()
    fd.append('file', file, filename)
    const res = await fetch(`${API}/api/parse-tree`, { method: 'POST', body: fd })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json()
    setRawTree(data.tree)
  }

  useEffect(() => {
    fetch('/examples/example_tree.nwk').then((r) => r.text()).then(async (t) => {
      await parseTreeFile(new Blob([t]), 'example_tree.nwk')
      setMsg('Example tree loaded')
    }).catch(() => setMsg('Failed to load example tree'))
  }, [setRawTree])

  useEffect(() => {
    const clickOutside = (ev: MouseEvent) => {
      if (!menuWrapRef.current) return
      if (!menuWrapRef.current.contains(ev.target as Node)) setOpenMenu(null)
    }
    document.addEventListener('click', clickOutside)
    return () => document.removeEventListener('click', clickOutside)
  }, [])

  const uploadTree = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      await parseTreeFile(f, f.name)
      setMsg('Tree loaded')
    } catch (err) {
      setMsg(`Tree parse error: ${String(err)}`)
    }
  }

  const uploadMatch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const mf = e.target.files?.[0]
    if (!mf) return
    const tf = document.getElementById('treeFileInput') as HTMLInputElement | null
    const treeFile = tf?.files?.[0]
    if (!treeFile) {
      setMsg('Please upload a tree file first, then upload metadata for matching.')
      return
    }
    const fd = new FormData()
    fd.append('tree_file', treeFile)
    fd.append('metadata_file', mf)
    const res = await fetch(`${API}/api/match`, { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) {
      setMsg(`Match error: ${JSON.stringify(data)}`)
      return
    }
    setRawTree(data.tree)
    setMsg(`Matched ${data.matched_count}, unmatched leaves ${data.unmatched_leaves.length}, unmatched metadata ${data.unmatched_metadata_ids.length}`)
  }

  const exportSvg = () => {
    const svg = document.querySelector('svg')
    if (!svg) return
    const s = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([s], { type: 'image/svg+xml' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'protein-tree-studio.svg'
    a.click()
    setMsg('Exported current canvas as SVG')
  }


  const applyColorToSelection = () => {
    if (!selected) {
      setMsg('Please click a node/clade first, then apply color.')
      return
    }
    applyManualColor(selected.id, paintColor, paintScope)
    setMsg(`Applied ${paintColor} to ${paintScope === 'node' ? 'selected node' : 'selected clade'}`)
  }

  const saveSession = () => {
    const blob = new Blob([JSON.stringify({ rawTree, search, workspace, panel, savedAt: new Date().toISOString(), appVersion: APP_VERSION }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'protein-tree-studio-session.json'
    a.click()
    setMsg('Session exported as JSON')
  }

  return <div className='h-screen grid grid-rows-[48px_1fr_24px] bg-slate-100'>
    <header className='mx-2 mt-2 flex items-center justify-between px-4 py-2 border bg-white rounded-xl shadow-sm'>
      <div ref={menuWrapRef} className='relative flex items-center gap-5 text-sm'>
        <div className='relative'>
          <button className='hover:text-blue-700' onClick={() => setOpenMenu((m) => m === 'file' ? null : 'file')}>文件</button>
          {openMenu === 'file' && <div className='absolute z-20 mt-2 w-56 rounded-xl border bg-white shadow-lg overflow-hidden'>
            <button className='block w-full text-left px-3 py-2 hover:bg-slate-100 transition-colors' onClick={saveSession}>保存</button>
            <button className='block w-full text-left px-3 py-2 hover:bg-slate-100 transition-colors' onClick={saveSession}>另存为…</button>
            <button className='block w-full text-left px-3 py-2 hover:bg-slate-100 transition-colors' onClick={exportSvg}>导出 SVG</button>
          </div>}
        </div>
        <div className='relative'>
          <button className='hover:text-blue-700' onClick={() => setOpenMenu((m) => m === 'edit' ? null : 'edit')}>编辑</button>
          {openMenu === 'edit' && <div className='absolute z-20 mt-2 w-56 rounded-xl border bg-white shadow-lg overflow-hidden'>
            <button className='block w-full text-left px-3 py-2 hover:bg-slate-100 transition-colors' onClick={undo}>撤销</button>
            <button className='block w-full text-left px-3 py-2 hover:bg-slate-100 transition-colors' onClick={redo}>重做</button>
          </div>}
        </div>
        <div className='relative'>
          <button className='hover:text-blue-700' onClick={() => setOpenMenu((m) => m === 'about' ? null : 'about')}>关于</button>
          {openMenu === 'about' && <div className='absolute right-0 z-20 mt-2 w-72 rounded-xl border bg-white shadow-lg p-3 space-y-2'>
            <div className='font-medium'>Protein Tree Studio</div>
            <div className='text-xs text-slate-600'>版本信息：{APP_VERSION}</div>
            <div className='text-xs text-slate-600'>帮助文档：README.md（项目根目录）</div>
            <div className='text-xs text-slate-600'>版本更新：当前为 iTOL-style control center MVP。</div>
          </div>}
        </div>
      </div>
      <div className='font-semibold'>Protein Tree Studio</div>
    </header>

    <div className='grid grid-cols-[360px_1fr_320px] gap-2 px-2 pb-2'>
      <aside className='p-3 space-y-3 bg-white rounded-xl border shadow-sm overflow-y-auto'>
        <h2 className='font-semibold'>Control Center (iTOL-style)</h2>

        <section className='border rounded-lg p-2'>
          <h3 className='text-sm font-medium mb-2'>Data Import</h3>
          <div><label className='text-xs'>Upload Newick</label><input id='treeFileInput' type='file' onChange={uploadTree} /></div>
          <div className='mt-2'><label className='text-xs'>Upload Metadata (match)</label><input type='file' onChange={uploadMatch} /></div>
        </section>

        <section className='border rounded-lg p-2'>
          <h3 className='text-sm font-medium mb-2'>Layout</h3>
          <label className='block text-xs'><input type='checkbox' checked={panel.radialMode} onChange={(e) => setPanel({ ...panel, radialMode: e.target.checked })} /> Circular/Radial mode (preview)</label>
          <label className='block text-xs mt-1'><input type='checkbox' checked={panel.alignLabels} onChange={(e) => setPanel({ ...panel, alignLabels: e.target.checked })} /> Align leaf labels</label>
          <label className='block text-xs mt-1'>Collapse depth: {panel.collapseDepth}<input className='w-full' type='range' min={0} max={10} value={panel.collapseDepth} onChange={(e) => setPanel({ ...panel, collapseDepth: Number(e.target.value) })} /></label>
        </section>

        <section className='border rounded-lg p-2'>
          <h3 className='text-sm font-medium mb-2'>Labels & Branches</h3>
          <label className='block text-xs'><input type='checkbox' checked={panel.showLeafLabels} onChange={(e) => setPanel({ ...panel, showLeafLabels: e.target.checked })} /> Show leaf labels</label>
          <label className='block text-xs mt-1'><input type='checkbox' checked={panel.showBranchLength} onChange={(e) => setPanel({ ...panel, showBranchLength: e.target.checked })} /> Show branch lengths</label>
          <label className='block text-xs mt-1'>Label size: {panel.labelSize}<input className='w-full' type='range' min={8} max={20} value={panel.labelSize} onChange={(e) => setPanel({ ...panel, labelSize: Number(e.target.value) })} /></label>
          <label className='block text-xs mt-1'>Branch thickness: {panel.branchThickness.toFixed(1)}<input className='w-full' type='range' min={1} max={5} step={0.5} value={panel.branchThickness} onChange={(e) => setPanel({ ...panel, branchThickness: Number(e.target.value) })} /></label>
        </section>

        <section className='border rounded-lg p-2'>
          <h3 className='text-sm font-medium mb-2'>Node/Clade Paint (No metadata required)</h3>
          <div className='flex items-center gap-2 mb-2'>
            <input type='color' value={paintColor} onChange={(e) => setPaintColor(e.target.value)} />
            <select className='border rounded-lg p-1 text-xs' value={paintScope} onChange={(e) => setPaintScope(e.target.value as ColorScope)}>
              <option value='node'>Selected node</option>
              <option value='clade'>Selected clade</option>
            </select>
          </div>
          <button className='border rounded-lg px-2 py-1 mr-2 text-sm' onClick={applyColorToSelection}>Apply Color</button>
          <button className='border rounded-lg px-2 py-1 text-sm' onClick={clearManualColors}>Clear Painted Colors</button>
          <p className='text-xs text-slate-500 mt-2'>Tip: click a node in the tree first, then apply color.</p>
        </section>

        <section className='border rounded-lg p-2'>
          <h3 className='text-sm font-medium mb-2'>Metadata Tracks</h3>
          <label className='block text-xs'><input type='checkbox' checked={panel.showMetadataStrip} onChange={(e) => setPanel({ ...panel, showMetadataStrip: e.target.checked })} /> Show metadata color strip</label>
          <label className='block text-xs mt-1'>Strip width: {panel.metadataStripWidth}px<input className='w-full' type='range' min={6} max={30} value={panel.metadataStripWidth} onChange={(e) => setPanel({ ...panel, metadataStripWidth: Number(e.target.value) })} /></label>
          <label className='block text-xs mt-1'><input type='checkbox' checked={panel.showLegend} onChange={(e) => setPanel({ ...panel, showLegend: e.target.checked })} /> Show legend</label>
        </section>

        <section className='border rounded-lg p-2'>
          <h3 className='text-sm font-medium mb-2'>Search & Selection</h3>
          <input className='border rounded-lg p-1.5 w-full' placeholder='Search leaf...' value={search} onChange={(e) => setSearch(e.target.value)} />
          <label className='block text-xs mt-1'><input type='checkbox' checked={panel.searchCaseSensitive} onChange={(e) => setPanel({ ...panel, searchCaseSensitive: e.target.checked })} /> Case-sensitive search</label>
        </section>

        <section className='border rounded-lg p-2'>
          <h3 className='text-sm font-medium mb-2'>Export</h3>
          <button className='border rounded-lg px-2 py-1 mr-2 text-sm' onClick={exportSvg}>Export SVG</button>
          <button className='border rounded-lg px-2 py-1 text-sm' onClick={saveSession}>Save Session JSON</button>
        </section>

        <p className='text-xs text-slate-500'>{msg}</p>
      </aside>

      <main className='bg-white rounded-xl border shadow-sm overflow-hidden'>{rawTree ? <TreeView /> : <div className='p-4'>No tree loaded</div>}</main>

      <aside className='p-3 bg-white rounded-xl border shadow-sm'>
        <h2 className='font-semibold'>Inspector</h2>
        <div className='text-xs text-slate-500 mb-2'>Workspace: {workspace}</div>
        <div className='mb-2'>
          <button className='border rounded-lg px-2 py-1 mr-2 text-xs' onClick={() => setWorkspace('analysis')}>Analysis</button>
          <button className='border rounded-lg px-2 py-1 text-xs' onClick={() => setWorkspace('publication')}>Publication</button>
        </div>
        {selected ? <pre className='text-xs whitespace-pre-wrap'>{JSON.stringify(selected, null, 2)}</pre> : <p className='text-sm text-slate-500'>Click a node.</p>}
      </aside>
    </div>
    <footer className='mx-2 mb-2 rounded-xl border px-3 text-xs flex items-center bg-white text-slate-600 shadow-sm'>Status: {msg || 'Ready'}</footer>
  </div>
}
