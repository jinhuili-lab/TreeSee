import { useEffect, useState } from 'react'
import TreeView from './components/TreeView'
import { useStore } from './lib/store'

const API='http://localhost:8000'
export default function App(){
 const {tree,setTree,selected,search,setSearch}=useStore(); const [msg,setMsg]=useState('')
 useEffect(()=>{fetch('/examples/example_tree.nwk').then(r=>r.text()).then(async(t)=>{const fd=new FormData();fd.append('file',new Blob([t]),'tree.nwk'); const res=await fetch(`${API}/api/parse-tree`,{method:'POST',body:fd}); const data=await res.json(); setTree(data.tree)})},[setTree])
 const upload=async(e:React.ChangeEvent<HTMLInputElement>,kind:'tree'|'meta')=>{const f=e.target.files?.[0]; if(!f||!tree&&kind==='meta') return; if(kind==='tree'){const fd=new FormData();fd.append('file',f); const r=await fetch(`${API}/api/parse-tree`,{method:'POST',body:fd}); const d=await r.json(); setTree(d.tree); setMsg('Tree loaded')} else {const tf=prompt('Upload tree first, using current tree is not yet serialized in MVP. Please re-upload tree filename?'); if(tf===null) return; setMsg('For metadata matching please use backend /api/match in this MVP.') }}
 const exportSvg=()=>{const svg=document.querySelector('svg'); if(!svg) return; const s=new XMLSerializer().serializeToString(svg); const blob=new Blob([s],{type:'image/svg+xml'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='protein-tree-studio.svg'; a.click() }
 const saveState=()=>{localStorage.setItem('pts_state',JSON.stringify(useStore.getState())); setMsg('State saved')}
 const loadState=()=>{const raw=localStorage.getItem('pts_state'); if(raw){const s=JSON.parse(raw); if(s.tree) setTree(s.tree); setSearch(s.search||''); setMsg('State loaded')}}
 return <div className='h-screen grid grid-cols-[280px_1fr_300px]'>
  <aside className='border-r p-3 space-y-3'><h1 className='font-bold text-lg'>Protein Tree Studio</h1><p className='text-xs text-slate-600'>Protein/domain tree & dendrogram viewer</p><div><label className='text-sm'>Upload Newick</label><input type='file' onChange={(e)=>upload(e,'tree')} /></div><div><label className='text-sm'>Upload Metadata</label><input type='file' onChange={(e)=>upload(e,'meta')} /></div><div><input className='border p-1 w-full' placeholder='Search leaf...' value={search} onChange={(e)=>setSearch(e.target.value)} /></div><button className='border px-2 py-1 mr-2' onClick={exportSvg}>Export SVG</button><button className='border px-2 py-1 mr-2' onClick={saveState}>Save JSON</button><button className='border px-2 py-1' onClick={loadState}>Load JSON</button><p className='text-xs text-slate-500'>{msg}</p></aside>
  <main>{tree?<TreeView/>:<div className='p-4'>No tree loaded</div>}</main>
  <aside className='border-l p-3'><h2 className='font-semibold'>Node details</h2>{selected?<pre className='text-xs whitespace-pre-wrap'>{JSON.stringify(selected,null,2)}</pre>:<p className='text-sm text-slate-500'>Click a node.</p>}</aside>
 </div>
}
