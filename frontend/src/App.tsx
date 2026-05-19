import { useEffect, useRef, useState } from 'react'
import TreeView from './components/TreeView'
import { useStore } from './lib/store'

const API = 'http://localhost:8000'
const APP_VERSION = '0.2.0-mvp'

type TopMenu = 'file' | 'edit' | 'about' | null

export default function App() {
  const { rawTree, setRawTree, selected, search, setSearch, undo, redo, workspace, setWorkspace } = useStore()
  const [msg, setMsg] = useState('')
  const [openMenu, setOpenMenu] = useState<TopMenu>(null)
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
    const note = `Matched ${data.matched_count}, unmatched leaves ${data.unmatched_leaves.length}, unmatched metadata ${data.unmatched_metadata_ids.length}`
    setMsg(note)
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

  const saveSession = () => {
    const snapshot = {
      rawTree,
      search,
      workspace,
      savedAt: new Date().toISOString(),
      appVersion: APP_VERSION,
    }
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'protein-tree-studio-session.json'
    a.click()
    setMsg('Session exported as JSON')
  }

  const saveAs = () => {
    saveSession()
    setMsg('Save As completed (JSON session exported)')
  }

  return <div className='h-screen grid grid-rows-[48px_1fr_24px] bg-slate-100'>
    <header className='mx-2 mt-2 flex items-center justify-between px-4 py-2 border bg-white rounded-xl shadow-sm'>
      <div className='font-semibold'>Protein Tree Studio</div>
      <div ref={menuWrapRef} className='relative flex items-center gap-5 text-sm'>
        <div className='relative'>
          <button className='hover:text-blue-700' onClick={() => setOpenMenu((m) => m === 'file' ? null : 'file')}>文件</button>
          {openMenu === 'file' && <div className='absolute z-20 mt-2 w-56 rounded-xl border bg-white shadow-lg overflow-hidden'>
            <button className='block w-full text-left px-3 py-2 hover:bg-slate-100 transition-colors' onClick={saveSession}>保存</button>
            <button className='block w-full text-left px-3 py-2 hover:bg-slate-100 transition-colors' onClick={saveAs}>另存为…</button>
            <button className='block w-full text-left px-3 py-2 hover:bg-slate-100 transition-colors' onClick={exportSvg}>导出 SVG</button>
          </div>}
        </div>
        <div className='relative'>
          <button className='hover:text-blue-700' onClick={() => setOpenMenu((m) => m === 'edit' ? null : 'edit')}>编辑</button>
          {openMenu === 'edit' && <div className='absolute z-20 mt-2 w-56 rounded-xl border bg-white shadow-lg overflow-hidden'>
            <button className='block w-full text-left px-3 py-2 hover:bg-slate-100 transition-colors' onClick={undo}>撤销</button>
            <button className='block w-full text-left px-3 py-2 hover:bg-slate-100 transition-colors' onClick={redo}>重做</button>
            <div className='px-3 py-2 text-xs text-slate-500 border-t'>选择工作区</div>
            <button className='block w-full text-left px-3 py-2 hover:bg-slate-100 transition-colors' onClick={() => setWorkspace('analysis')}>Analysis Workspace</button>
            <button className='block w-full text-left px-3 py-2 hover:bg-slate-100 transition-colors' onClick={() => setWorkspace('publication')}>Publication Workspace</button>
          </div>}
        </div>
        <div className='relative'>
          <button className='hover:text-blue-700' onClick={() => setOpenMenu((m) => m === 'about' ? null : 'about')}>关于</button>
          {openMenu === 'about' && <div className='absolute right-0 z-20 mt-2 w-72 rounded-xl border bg-white shadow-lg p-3 space-y-2'>
            <div className='font-medium'>Protein Tree Studio</div>
            <div className='text-xs text-slate-600'>版本信息：{APP_VERSION}</div>
            <div className='text-xs text-slate-600'>帮助文档：README.md（项目根目录）</div>
            <div className='text-xs text-slate-600'>版本更新：当前为 MVP 阶段，后续将强化多 track、导出预设与桌面客户端。</div>
          </div>}
        </div>
      </div>
    </header>
    <div className='grid grid-cols-[290px_1fr_320px] gap-2 px-2 pb-2'>
      <aside className='p-3 space-y-3 bg-white rounded-xl border shadow-sm'>
        <h2 className='font-semibold'>Data & Layers</h2>
        <div><label className='text-sm'>Upload Newick</label><input id='treeFileInput' type='file' onChange={uploadTree} /></div>
        <div><label className='text-sm'>Upload Metadata (match)</label><input type='file' onChange={uploadMatch} /></div>
        <div><input className='border rounded-lg p-1.5 w-full' placeholder='Search leaf...' value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <button className='border rounded-lg px-2 py-1 mr-2' onClick={exportSvg}>Export SVG</button>
        <p className='text-xs text-slate-500'>{msg}</p>
      </aside>
      <main className='bg-white rounded-xl border shadow-sm overflow-hidden'>{rawTree ? <TreeView /> : <div className='p-4'>No tree loaded</div>}</main>
      <aside className='p-3 bg-white rounded-xl border shadow-sm'>
        <h2 className='font-semibold'>Inspector</h2>
        {selected ? <pre className='text-xs whitespace-pre-wrap'>{JSON.stringify(selected, null, 2)}</pre> : <p className='text-sm text-slate-500'>Click a node.</p>}
      </aside>
    </div>
    <footer className='mx-2 mb-2 rounded-xl border px-3 text-xs flex items-center bg-white text-slate-600 shadow-sm'>Status: {msg || 'Ready'}</footer>
  </div>
}
