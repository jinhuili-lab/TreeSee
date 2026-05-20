import { useEffect, useRef, useState } from 'react'
import TreeView from './components/TreeView'
import { useStore } from './lib/store'
import type { BranchLengthMode, ColorScope, LayoutMode } from './lib/types'
import { desktopAboutInfo, desktopGetRecentFiles, desktopOpenNewick, desktopSaveText, isDesktopRuntime } from './lib/desktop'

const API = 'http://localhost:8000'
type TopMenu = 'file' | 'edit' | 'about' | null
type ExportFormat = 'svg' | 'png' | 'jpg' | 'tiff' | 'pdf'
type PageSize = 'letter' | 'a4' | 'a3'
const pageSizeMap: Record<PageSize, { width: number; height: number }> = { letter: { width: 2550, height: 3300 }, a4: { width: 2480, height: 3508 }, a3: { width: 3508, height: 4961 } }

export default function App() {
  const { rawTree, setRawTree, selected, search, setSearch, undo, redo, workspace, setWorkspace, applyManualColor, clearManualColors, layoutMode, setLayoutMode, branchLengthMode, setBranchLengthMode } = useStore()
  const [msg, setMsg] = useState('')
  const [openMenu, setOpenMenu] = useState<TopMenu>(null)
  const [paintColor, setPaintColor] = useState('#ef4444')
  const [paintScope, setPaintScope] = useState<ColorScope>('node')
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [recentFiles, setRecentFiles] = useState<string[]>([])
  const [aboutText, setAboutText] = useState('')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const [exportScale, setExportScale] = useState(2)
  const [exportPageSize, setExportPageSize] = useState<PageSize>('letter')
  const menuWrapRef = useRef<HTMLDivElement>(null)

  const parseTreeFile = async (file: File | Blob, filename: string) => {
    const fd = new FormData(); fd.append('file', file, filename)
    const res = await fetch(`${API}/api/parse-tree`, { method: 'POST', body: fd })
    const data = await res.json(); setRawTree(data.tree)
  }
  useEffect(() => { fetch('/examples/example_tree.nwk').then((r) => r.text()).then((t) => parseTreeFile(new Blob([t]), 'example.nwk')) }, [setRawTree])
  useEffect(() => { const h = (ev: MouseEvent) => { if (menuWrapRef.current && !menuWrapRef.current.contains(ev.target as Node)) setOpenMenu(null) }; document.addEventListener('click', h); return () => document.removeEventListener('click', h) }, [])
  useEffect(() => { if (isDesktopRuntime()) { desktopGetRecentFiles().then(setRecentFiles).catch(() => undefined); desktopAboutInfo().then(setAboutText).catch(() => undefined) } }, [])
  useEffect(() => { if (selected) applyManualColor(selected.id, paintColor, paintScope) }, [selected, paintColor, paintScope, applyManualColor])


  const openFromDesktop = async () => {
    try {
      const result = await desktopOpenNewick()
      await parseTreeFile(new Blob([result.content]), result.path.split('/').pop() || 'opened.nwk')
      setRecentFiles(await desktopGetRecentFiles())
      setMsg(`Opened from desktop: ${result.path}`)
    } catch (err) {
      setMsg(`Desktop open failed: ${String(err)}`)
    }
  }

  const saveSessionDesktop = async () => {
    try {
      const payload = JSON.stringify({ rawTree, search, workspace, layoutMode, branchLengthMode }, null, 2)
      const path = await desktopSaveText('protein-tree-studio-session.json', payload)
      setMsg(`Saved session to ${path}`)
    } catch (err) {
      setMsg(`Desktop save failed: ${String(err)}`)
    }
  }

  const uploadTree = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; await parseTreeFile(f, f.name); setMsg('Tree loaded') }
  const exportWithSettings = async () => {
    const svg = document.querySelector('main svg') as SVGSVGElement | null; if (!svg) return
    const svgText = new XMLSerializer().serializeToString(svg)
    if (exportFormat === 'svg') { const blob = new Blob([svgText], { type: 'image/svg+xml' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'tree.svg'; a.click(); return }
    const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText); await new Promise((r) => (img.onload = r))
    const page = pageSizeMap[exportPageSize]; const canvas = document.createElement('canvas'); canvas.width = Math.round((page.width * exportScale) / 2); canvas.height = Math.round((page.height * exportScale) / 2)
    const ctx = canvas.getContext('2d'); if (!ctx) return; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    const fit = Math.min(canvas.width / img.width, canvas.height / img.height); const w = img.width * fit; const h = img.height * fit
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)
    if (exportFormat === 'pdf') { const w = window.open('', '_blank'); if (!w) return; w.document.write(`<img style='width:100%;height:auto' src='${canvas.toDataURL('image/png')}'/>`); w.document.close(); w.print(); setMsg('PDF: use print dialog save as PDF'); return }
    const mime = exportFormat === 'jpg' ? 'image/jpeg' : exportFormat === 'tiff' ? 'image/tiff' : 'image/png'; const a = document.createElement('a'); a.href = canvas.toDataURL(mime, 0.95); a.download = `tree.${exportFormat}`; a.click(); setMsg(`Exported ${exportFormat}`)
  }

  return <div className='h-screen grid grid-rows-[48px_1fr_24px] bg-slate-100'>
    <header className='mx-2 mt-2 flex items-center justify-between px-4 py-2 border bg-white rounded-xl shadow-sm'>
      <div ref={menuWrapRef} className='relative flex items-center gap-5 text-sm'>
        <div className='relative'><button onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}>文件</button>{openMenu === 'file' && <div className='absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border bg-white shadow-lg overflow-hidden'>{isDesktopRuntime() && <button className='block w-full text-left px-3 py-2 hover:bg-slate-100' onClick={openFromDesktop}>打开 Newick…</button>}{isDesktopRuntime() && <button className='block w-full text-left px-3 py-2 hover:bg-slate-100' onClick={saveSessionDesktop}>保存 Session…</button>}<button className='block w-full text-left px-3 py-2 hover:bg-slate-100' onClick={() => setShowExportDialog(true)}>保存 / 另存为 / 导出</button>{isDesktopRuntime() && recentFiles.length > 0 && <div className='border-t px-3 py-2 text-xs text-slate-500'>Recent files</div>}{isDesktopRuntime() && recentFiles.map((f) => <div key={f} className='px-3 py-1 text-xs text-slate-600 truncate'>{f}</div>)}</div>}</div>
        <div className='relative'><button onClick={() => setOpenMenu(openMenu === 'edit' ? null : 'edit')}>编辑</button>{openMenu === 'edit' && <div className='absolute left-0 top-full z-20 mt-2 w-56 rounded-xl border bg-white shadow-lg overflow-hidden'><button className='block w-full text-left px-3 py-2 hover:bg-slate-100' onClick={undo}>撤销</button><button className='block w-full text-left px-3 py-2 hover:bg-slate-100' onClick={redo}>重做</button></div>}</div>
        <div className='relative'><button onClick={() => setOpenMenu(openMenu === 'about' ? null : 'about')}>关于</button>{openMenu === 'about' && <div className='absolute left-0 top-full z-20 mt-2 w-80 rounded-xl border bg-white shadow-lg p-3 text-xs whitespace-pre-wrap'>{aboutText || '版本更新：修复导出拉伸、增加布局模式和实时上色'}</div>}</div>
      </div><div className='font-semibold'>Protein Tree Studio</div>
    </header>

    <div className='grid grid-cols-[360px_1fr_320px] gap-2 px-2 pb-2'>
      <aside className='p-3 space-y-3 bg-white rounded-xl border shadow-sm overflow-y-auto'>
        <input id='treeFileInput' type='file' onChange={uploadTree} />
        <section className='border rounded-lg p-2'><h3 className='text-sm font-medium'>Layout</h3><select className='border rounded p-1 w-full' value={layoutMode} onChange={(e) => setLayoutMode(e.target.value as LayoutMode)}><option value='rectangular'>rectangular</option><option value='curved'>curved</option><option value='straight'>straight</option><option value='radial'>radiation</option><option value='circle'>circle</option></select><select className='border rounded p-1 w-full mt-2' value={branchLengthMode} onChange={(e) => setBranchLengthMode(e.target.value as BranchLengthMode)}><option value='with_size'>with size</option><option value='topology_only'>topology only</option></select></section>
        <section className='border rounded-lg p-2'><h3 className='text-sm font-medium'>Paint</h3><input type='color' value={paintColor} onChange={(e) => setPaintColor(e.target.value)} /><select className='border rounded p-1 ml-2' value={paintScope} onChange={(e) => setPaintScope(e.target.value as ColorScope)}><option value='node'>node</option><option value='branch'>branch</option><option value='clade'>clade region</option></select><button className='border rounded px-2 py-1 ml-2' onClick={clearManualColors}>clear</button><div className='text-xs text-slate-500'>实时交互：选中节点后改颜色立即生效</div></section>

        <section className='border rounded-lg p-2'>
          <h3 className='text-sm font-medium'>Tracks & Legend</h3>
          <label className='text-xs block mt-1'><input type='checkbox' defaultChecked /> show metadata strip</label>
          <label className='text-xs block mt-1'><input type='checkbox' defaultChecked /> show legend</label>
          <label className='text-xs block mt-1'>track width<input className='w-full' type='range' min={6} max={30} defaultValue={12} /></label>
        </section>
        <section className='border rounded-lg p-2'>
          <h3 className='text-sm font-medium'>Branch / Label Style</h3>
          <label className='text-xs block mt-1'>branch thickness<input className='w-full' type='range' min={1} max={5} step={0.5} defaultValue={1.5} /></label>
          <label className='text-xs block mt-1'>label size<input className='w-full' type='range' min={8} max={20} defaultValue={12} /></label>
          <label className='text-xs block mt-1'><input type='checkbox' defaultChecked /> align leaf labels</label>
        </section>
        <section className='border rounded-lg p-2'>
          <h3 className='text-sm font-medium'>Performance</h3>
          <label className='text-xs block mt-1'><input type='checkbox' defaultChecked /> hide labels when zoomed out</label>
          <label className='text-xs block mt-1'><input type='checkbox' defaultChecked /> lightweight path rendering</label>
        </section>

        <input className='border rounded p-1 w-full' value={search} onChange={(e) => setSearch(e.target.value)} placeholder='search' />
        <div className='text-xs text-slate-500'>{msg}</div>
      </aside>
      <main className='bg-white rounded-xl border shadow-sm overflow-hidden'>{rawTree ? <TreeView /> : <div className='p-4'>No tree loaded</div>}</main>
      <aside className='p-3 bg-white rounded-xl border shadow-sm'><h2 className='font-semibold'>Inspector</h2><div>{workspace}</div><button onClick={() => setWorkspace('analysis')}>analysis</button><button onClick={() => setWorkspace('publication')}>publication</button></aside>
    </div>
    <footer className='mx-2 mb-2 rounded-xl border px-3 text-xs flex items-center bg-white text-slate-600 shadow-sm'>Status: {msg || 'Ready'}</footer>

    {showExportDialog && <div className='fixed inset-0 bg-black/30 flex items-center justify-center z-40'><div className='w-[420px] rounded-xl bg-white border shadow-xl p-4 space-y-3'><h3 className='font-semibold'>Export / Save As</h3><select className='border rounded p-1 w-full' value={exportFormat} onChange={(e) => setExportFormat(e.target.value as ExportFormat)}><option value='svg'>svg</option><option value='png'>png</option><option value='jpg'>jpg</option><option value='tiff'>tiff</option><option value='pdf'>pdf</option></select><input className='w-full' type='range' min={1} max={4} value={exportScale} onChange={(e) => setExportScale(Number(e.target.value))} /><select className='border rounded p-1 w-full' value={exportPageSize} onChange={(e) => setExportPageSize(e.target.value as PageSize)}><option value='letter'>letter</option><option value='a4'>a4</option><option value='a3'>a3</option></select><div className='flex justify-end gap-2'><button className='border rounded px-3 py-1' onClick={() => setShowExportDialog(false)}>cancel</button><button className='border rounded px-3 py-1 bg-slate-900 text-white' onClick={exportWithSettings}>export</button></div></div></div>}
  </div>
}
