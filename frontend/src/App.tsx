import { useEffect, useState } from 'react'
import TreeView from './components/TreeView'
import { useStore } from './lib/store'

const API = 'http://localhost:8000'

export default function App() {
  const { tree, setTree, selected, view, setSearch, setTool, ui, toggleLeftPanel, toggleRightPanel, undo, redo } = useStore()
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/examples/example_tree.nwk').then((r) => r.text()).then(async (t) => {
      const fd = new FormData()
      fd.append('file', new Blob([t]), 'tree.nwk')
      const res = await fetch(`${API}/api/parse-tree`, { method: 'POST', body: fd })
      const data = await res.json()
      setTree(data.tree)
    })
  }, [setTree])

  return <div className='h-screen flex flex-col'>
    <header className='h-12 border-b bg-white flex items-center px-3 gap-2'>
      <strong>Protein Tree Studio</strong>
      <button className='border px-2' onClick={() => setTool('select')}>Select</button>
      <button className='border px-2' onClick={() => setTool('pan')}>Pan</button>
      <button className='border px-2' onClick={() => setTool('zoom')}>Zoom</button>
      <button className='border px-2' onClick={undo}>Undo</button>
      <button className='border px-2' onClick={redo}>Redo</button>
      <span className='text-xs text-slate-500'>Tool: {view.tool}</span>
    </header>
    <div className='flex-1 grid grid-cols-[280px_1fr_320px]'>
      <aside className={`border-r p-3 space-y-2 ${ui.leftPanelOpen ? '' : 'hidden'}`}>
        <button className='border px-2 py-1' onClick={toggleLeftPanel}>Hide Panel</button>
        <input className='border p-1 w-full' placeholder='Search leaf...' value={view.search} onChange={(e) => setSearch(e.target.value)} />
        <p className='text-xs text-slate-500'>{msg}</p>
      </aside>
      <main>{tree ? <TreeView /> : <div className='p-4'>No tree loaded</div>}</main>
      <aside className={`border-l p-3 ${ui.rightPanelOpen ? '' : 'hidden'}`}>
        <button className='border px-2 py-1 mb-2' onClick={toggleRightPanel}>Hide Panel</button>
        <h2 className='font-semibold'>Inspector</h2>
        {selected ? <pre className='text-xs whitespace-pre-wrap'>{JSON.stringify(selected, null, 2)}</pre> : <p className='text-sm text-slate-500'>Click a node.</p>}
      </aside>
    </div>
    <footer className='h-8 border-t bg-white px-3 text-xs flex items-center justify-between'>
      <button className='border px-2 py-0.5' onClick={toggleLeftPanel}>Toggle Left</button>
      <span>Status: {tree ? 'Tree loaded' : 'No tree'} | Search: {view.search || 'none'}</span>
      <button className='border px-2 py-0.5' onClick={toggleRightPanel}>Toggle Right</button>
    </footer>
  </div>
}
