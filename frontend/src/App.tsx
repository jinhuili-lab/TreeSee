import { useEffect, useRef, useState } from 'react'
import TreeView from './components/TreeView'
import { useStore } from './lib/store'
import type { ColorScope } from './lib/types'

const API = 'http://localhost:8000'
const APP_VERSION = '0.4.0-mvp'

type TopMenu = 'file' | 'edit' | 'about' | null
type ExportFormat = 'svg' | 'png' | 'jpg' | 'tiff' | 'pdf'
type PageSize = 'letter' | 'a4' | 'a3'

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
  radialMode: false, showLeafLabels: true, showBranchLength: false, showLegend: true,
  branchThickness: 1.5, labelSize: 12, alignLabels: true, showMetadataStrip: true, metadataStripWidth: 12,
  collapseDepth: 0, searchCaseSensitive: false,
}

const pageSizeMap: Record<PageSize, { width: number; height: number }> = {
  letter: { width: 2550, height: 3300 },
  a4: { width: 2480, height: 3508 },
  a3: { width: 3508, height: 4961 },
}

export default function App() {
  const { rawTree, setRawTree, selected, search, setSearch, undo, redo, workspace, setWorkspace, applyManualColor, clearManualColors } = useStore()
  const [msg, setMsg] = useState('')
  const [openMenu, setOpenMenu] = useState<TopMenu>(null)
  const [panel, setPanel] = useState<PanelState>(defaultPanelState)
  const [paintColor, setPaintColor] = useState('#ef4444')
  const [paintScope, setPaintScope] = useState<ColorScope>('node')
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png')
  const [exportScale, setExportScale] = useState(2)
  const [exportPageSize, setExportPageSize] = useState<PageSize>('letter')
  const menuWrapRef = useRef<HTMLDivElement>(null)

  const parseTreeFile = async (file: File | Blob, filename: string) => {
    const fd = new FormData(); fd.append('file', file, filename)
    const res = await fetch(`${API}/api/parse-tree`, { method: 'POST', body: fd })
    if (!res.ok) throw new Error(await res.text())
    const data = await res.json(); setRawTree(data.tree)
  }

  useEffect(() => { fetch('/examples/example_tree.nwk').then((r) => r.text()).then(async (t) => { await parseTreeFile(new Blob([t]), 'example_tree.nwk'); setMsg('Example tree loaded') }).catch(() => setMsg('Failed to load example tree')) }, [setRawTree])
  useEffect(() => { const clickOutside = (ev: MouseEvent) => { if (!menuWrapRef.current) return; if (!menuWrapRef.current.contains(ev.target as Node)) setOpenMenu(null) }; document.addEventListener('click', clickOutside); return () => document.removeEventListener('click', clickOutside) }, [])

  const uploadTree = async (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; try { await parseTreeFile(f, f.name); setMsg('Tree loaded') } catch (err) { setMsg(`Tree parse error: ${String(err)}`) } }

  const uploadMatch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const mf = e.target.files?.[0]; if (!mf) return
    const tf = document.getElementById('treeFileInput') as HTMLInputElement | null
    const treeFile = tf?.files?.[0]
    if (!treeFile) { setMsg('Please upload a tree file first, then upload metadata for matching.'); return }
    const fd = new FormData(); fd.append('tree_file', treeFile); fd.append('metadata_file', mf)
    const res = await fetch(`${API}/api/match`, { method: 'POST', body: fd }); const data = await res.json()
    if (!res.ok) { setMsg(`Match error: ${JSON.stringify(data)}`); return }
    setRawTree(data.tree)
    setMsg(`Matched ${data.matched_count}, unmatched leaves ${data.unmatched_leaves.length}, unmatched metadata ${data.unmatched_metadata_ids.length}`)
  }

  const serializeSvg = () => {
    const svg = document.querySelector('main svg') as SVGSVGElement | null
    if (!svg) throw new Error('No tree canvas found')
    return new XMLSerializer().serializeToString(svg)
  }

  const exportWithSettings = async () => {
    const svgText = serializeSvg()
    if (exportFormat === 'svg') {
      const blob = new Blob([svgText], { type: 'image/svg+xml' })
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'protein-tree-studio.svg'; a.click()
      setMsg('Exported SVG'); setShowExportDialog(false); return
    }
    const img = new Image()
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText)
    await new Promise((resolve) => { img.onload = resolve })
    const page = pageSizeMap[exportPageSize]
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(page.width * exportScale / 2)
    canvas.height = Math.round(page.height * exportScale / 2)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not available')
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
    const fit = Math.min(canvas.width / img.width, canvas.height / img.height)
    const w = img.width * fit; const h = img.height * fit
    ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h)

    if (exportFormat === 'pdf') {
      const content = canvas.toDataURL('image/jpeg', 0.95)
      const pdf = `%PDF-1.3\n1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 ${canvas.width} ${canvas.height}] /Resources <</XObject <</Im0 4 0 R>>>> /Contents 5 0 R>> endobj\n4 0 obj <</Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${atob(content.split(',')[1]).length}>> stream\n${atob(content.split(',')[1])}\nendstream endobj\n5 0 obj <</Length 36>> stream\nq\n${canvas.width} 0 0 ${canvas.height} 0 0 cm\n/Im0 Do\nQ\nendstream endobj\nxref\n0 6\n0000000000 65535 f \ntrailer <</Root 1 0 R /Size 6>>\nstartxref\n0\n%%EOF`
      const blob = new Blob([pdf], { type: 'application/pdf' })
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'protein-tree-studio.pdf'; a.click()
      setMsg('Exported PDF'); setShowExportDialog(false); return
    }

    const mime = exportFormat === 'jpg' ? 'image/jpeg' : exportFormat === 'tiff' ? 'image/tiff' : 'image/png'
    const dataUrl = canvas.toDataURL(mime, 0.95)
    const a = document.createElement('a'); a.href = dataUrl; a.download = `protein-tree-studio.${exportFormat === 'jpg' ? 'jpg' : exportFormat}`; a.click()
    setMsg(`Exported ${exportFormat.toUpperCase()}`); setShowExportDialog(false)
  }

  const applyColorToSelection = () => { if (!selected) { setMsg('Please click a node/clade first, then apply color.'); return } applyManualColor(selected.id, paintColor, paintScope); setMsg(`Applied ${paintColor} to ${paintScope === 'node' ? 'selected node' : 'selected clade'}`) }

  return <div className='h-screen grid grid-rows-[48px_1fr_24px] bg-slate-100'>
    <header className='mx-2 mt-2 flex items-center justify-between px-4 py-2 border bg-white rounded-xl shadow-sm'>
      <div ref={menuWrapRef} className='relative flex items-center gap-5 text-sm'>
        <div className='relative'>
          <button className='hover:text-blue-700' onClick={() => setOpenMenu((m) => m === 'file' ? null : 'file')}>文件</button>
          {openMenu === 'file' && <div className='absolute left-0 top-full z-20 mt-2 w-64 rounded-xl border bg-white shadow-lg overflow-hidden'>
            <button className='block w-full text-left px-3 py-2 hover:bg-slate-100 transition-colors' onClick={() => setShowExportDialog(true)}>保存</button>
            <button className='block w-full text-left px-3 py-2 hover:bg-slate-100 transition-colors' onClick={() => setShowExportDialog(true)}>另存为…</button>
            <button className='block w-full text-left px-3 py-2 hover:bg-slate-100 transition-colors' onClick={() => setShowExportDialog(true)}>导出…</button>
          </div>}
        </div>
        <div className='relative'>
          <button className='hover:text-blue-700' onClick={() => setOpenMenu((m) => m === 'edit' ? null : 'edit')}>编辑</button>
          {openMenu === 'edit' && <div className='absolute left-0 top-full z-20 mt-2 w-56 rounded-xl border bg-white shadow-lg overflow-hidden'>
            <button className='block w-full text-left px-3 py-2 hover:bg-slate-100 transition-colors' onClick={undo}>撤销</button>
            <button className='block w-full text-left px-3 py-2 hover:bg-slate-100 transition-colors' onClick={redo}>重做</button>
          </div>}
        </div>
        <div className='relative'>
          <button className='hover:text-blue-700' onClick={() => setOpenMenu((m) => m === 'about' ? null : 'about')}>关于</button>
          {openMenu === 'about' && <div className='absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border bg-white shadow-lg p-3 space-y-2'>
            <div className='font-medium'>Protein Tree Studio</div>
            <div className='text-xs text-slate-600'>版本信息：{APP_VERSION}</div>
            <div className='text-xs text-slate-600'>帮助文档：README.md（项目根目录）</div>
            <div className='text-xs text-slate-600'>版本更新：导出弹窗、格式与页面尺寸控制已加入。</div>
          </div>}
        </div>
      </div>
      <div className='font-semibold'>Protein Tree Studio</div>
    </header>

    <div className='grid grid-cols-[360px_1fr_320px] gap-2 px-2 pb-2'>
      <aside className='p-3 space-y-3 bg-white rounded-xl border shadow-sm overflow-y-auto'>
        <h2 className='font-semibold'>Control Center (iTOL-style)</h2>
        <section className='border rounded-lg p-2'><h3 className='text-sm font-medium mb-2'>Data Import</h3><div><label className='text-xs'>Upload Newick</label><input id='treeFileInput' type='file' onChange={uploadTree} /></div><div className='mt-2'><label className='text-xs'>Upload Metadata (match)</label><input type='file' onChange={uploadMatch} /></div></section>
        <section className='border rounded-lg p-2'><h3 className='text-sm font-medium mb-2'>Search & Selection</h3><input className='border rounded-lg p-1.5 w-full' placeholder='Search leaf...' value={search} onChange={(e) => setSearch(e.target.value)} /><label className='block text-xs mt-1'><input type='checkbox' checked={panel.searchCaseSensitive} onChange={(e) => setPanel({ ...panel, searchCaseSensitive: e.target.checked })} /> Case-sensitive search</label></section>
        <section className='border rounded-lg p-2'><h3 className='text-sm font-medium mb-2'>Node/Clade Paint (No metadata required)</h3><div className='flex items-center gap-2 mb-2'><input type='color' value={paintColor} onChange={(e) => setPaintColor(e.target.value)} /><select className='border rounded-lg p-1 text-xs' value={paintScope} onChange={(e) => setPaintScope(e.target.value as ColorScope)}><option value='node'>Selected node</option><option value='clade'>Selected clade</option></select></div><button className='border rounded-lg px-2 py-1 mr-2 text-sm' onClick={applyColorToSelection}>Apply Color</button><button className='border rounded-lg px-2 py-1 text-sm' onClick={clearManualColors}>Clear Painted Colors</button></section>
        <p className='text-xs text-slate-500'>{msg}</p>
      </aside>
      <main className='bg-white rounded-xl border shadow-sm overflow-hidden'>{rawTree ? <TreeView /> : <div className='p-4'>No tree loaded</div>}</main>
      <aside className='p-3 bg-white rounded-xl border shadow-sm'><h2 className='font-semibold'>Inspector</h2><div className='text-xs text-slate-500 mb-2'>Workspace: {workspace}</div><div className='mb-2'><button className='border rounded-lg px-2 py-1 mr-2 text-xs' onClick={() => setWorkspace('analysis')}>Analysis</button><button className='border rounded-lg px-2 py-1 text-xs' onClick={() => setWorkspace('publication')}>Publication</button></div>{selected ? <pre className='text-xs whitespace-pre-wrap'>{JSON.stringify(selected, null, 2)}</pre> : <p className='text-sm text-slate-500'>Click a node.</p>}</aside>
    </div>
    <footer className='mx-2 mb-2 rounded-xl border px-3 text-xs flex items-center bg-white text-slate-600 shadow-sm'>Status: {msg || 'Ready'}</footer>

    {showExportDialog && <div className='fixed inset-0 bg-black/30 flex items-center justify-center z-40'>
      <div className='w-[420px] rounded-xl bg-white border shadow-xl p-4 space-y-3'>
        <h3 className='font-semibold'>Export / Save As</h3>
        <label className='text-sm block'>Format
          <select className='border rounded-lg p-1 w-full mt-1' value={exportFormat} onChange={(e) => setExportFormat(e.target.value as ExportFormat)}>
            <option value='svg'>SVG</option><option value='png'>PNG</option><option value='jpg'>JPG</option><option value='tiff'>TIFF</option><option value='pdf'>PDF</option>
          </select>
        </label>
        <label className='text-sm block'>Quality Scale (1-4)
          <input className='w-full' type='range' min={1} max={4} value={exportScale} onChange={(e) => setExportScale(Number(e.target.value))} />
          <div className='text-xs text-slate-500'>Current scale: {exportScale}x</div>
        </label>
        <label className='text-sm block'>Page Size
          <select className='border rounded-lg p-1 w-full mt-1' value={exportPageSize} onChange={(e) => setExportPageSize(e.target.value as PageSize)}>
            <option value='letter'>Letter</option><option value='a4'>A4</option><option value='a3'>A3</option>
          </select>
        </label>
        <div className='text-xs text-slate-500'>Exports current tree canvas region with white background and page fitting.</div>
        <div className='flex justify-end gap-2'><button className='border rounded-lg px-3 py-1' onClick={() => setShowExportDialog(false)}>Cancel</button><button className='border rounded-lg px-3 py-1 bg-slate-900 text-white' onClick={exportWithSettings}>Export</button></div>
      </div>
    </div>}
  </div>
}
