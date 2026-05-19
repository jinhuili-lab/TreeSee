import { useEffect, useMemo, useRef } from 'react'
import * as d3 from 'd3'
import { useStore } from '../lib/store'
import type { TreeNode } from '../lib/types'

function flattenMetadataColumns(node: TreeNode, acc = new Set<string>()) {
  if (node.metadata) Object.keys(node.metadata).forEach((k) => acc.add(k))
  node.children.forEach((c) => flattenMetadataColumns(c, acc))
  return acc
}

export default function TreeView() {
  const svgRef = useRef<SVGSVGElement>(null)
  const { rawTree: tree, search, colorColumn, setSelected, toggleCollapse } = useStore()
  const colorScale = useMemo(() => d3.scaleOrdinal(d3.schemeTableau10), [])

  useEffect(() => {
    if (!tree || !svgRef.current) return
    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()
    const g = svg.append('g')
    svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 8]).on('zoom', (e) => g.attr('transform', e.transform.toString())))
    const root = d3.hierarchy(tree as any, (d: any) => (d.collapsed ? [] : d.children))
    d3.tree<any>().nodeSize([24, 180])(root)
    const nodes = root.descendants()
    const links = root.links()
    const matched = new Set(nodes.filter((n) => n.data.is_leaf && search && n.data.name.toLowerCase().includes(search.toLowerCase())).map((n) => n))
    const pathSet = new Set<any>()
    matched.forEach((n) => {
      let c: any = n
      while (c) {
        pathSet.add(c)
        c = c.parent
      }
    })

    g.selectAll('path.link').data(links).enter().append('path').attr('fill', 'none').attr('stroke', (d) => (pathSet.has(d.target) ? '#dc2626' : '#64748b')).attr('d', d3.linkHorizontal<any, any>().x((d: any) => d.y + 20).y((d: any) => d.x + 20) as any)

    g.selectAll('circle.node').data(nodes).enter().append('circle').attr('cx', (d) => d.y + 20).attr('cy', (d) => d.x + 20).attr('r', 4).attr('fill', (d) => {
      if (!d.data.is_leaf) return '#0f172a'
      const v = colorColumn && d.data.metadata ? String(d.data.metadata[colorColumn] ?? '') : ''
      return v ? String(colorScale(v)) : '#334155'
    }).on('click', (_, d) => {
      if (!d.data.is_leaf) toggleCollapse(d.data.id)
      setSelected(d.data)
    })

    g.selectAll('text.label').data(nodes.filter((n) => n.data.is_leaf)).enter().append('text').attr('x', (d) => d.y + 28).attr('y', (d) => d.x + 24).text((d) => d.data.name).attr('font-size', 12).attr('fill', (d) => (pathSet.has(d) ? '#b91c1c' : '#0f172a'))
  }, [tree, search, colorColumn, setSelected, toggleCollapse, colorScale])

  const cols = tree ? Array.from(flattenMetadataColumns(tree)).filter((c) => c !== 'id') : []
  return <div className='h-full w-full'><div className='p-2 text-sm'>Metadata color: <select className='border rounded-lg ml-2 px-1 py-0.5' value={colorColumn} onChange={(e) => useStore.getState().setColorColumn(e.target.value)}><option value=''>None</option>{cols.map((c) => <option key={c}>{c}</option>)}</select></div><svg ref={svgRef} className='w-full h-[calc(100%-40px)] bg-white border rounded-b-xl' /></div>
}
