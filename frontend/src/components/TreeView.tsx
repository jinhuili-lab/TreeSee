import { useEffect, useMemo, useRef } from 'react'
import * as d3 from 'd3'
import { useStore } from '../lib/store'
import type { TreeNode } from '../lib/types'

function flattenMetadataColumns(node: TreeNode, acc = new Set<string>()) { if (node.metadata) Object.keys(node.metadata).forEach((k) => acc.add(k)); node.children.forEach((c) => flattenMetadataColumns(c, acc)); return acc }

export default function TreeView() {
  const svgRef = useRef<SVGSVGElement>(null)
  const { rawTree: tree, search, colorColumn, setSelected, toggleCollapse, manualNodeColors, manualBranchColors, layoutMode, branchLengthMode } = useStore()
  const colorScale = useMemo(() => d3.scaleOrdinal(d3.schemeTableau10), [])

  useEffect(() => {
    if (!tree || !svgRef.current) return
    const svg = d3.select(svgRef.current); svg.selectAll('*').remove(); const g = svg.append('g')
    svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.2, 8]).on('zoom', (e) => g.attr('transform', e.transform.toString())))
    const root = d3.hierarchy(tree as any, (d: any) => (d.collapsed ? [] : d.children))

    const xOf = (d: any) => d.x ?? 0
    const yOf = (d: any) => d.y ?? 0

    if (layoutMode === 'radial' || layoutMode === 'circle') {
      const radius = 450; d3.tree<any>().size([2 * Math.PI, radius])(root)
      const nodes = root.descendants(); const links = root.links()
      const radialPoint = (x: number, y: number) => [Math.cos(x - Math.PI / 2) * y + 500, Math.sin(x - Math.PI / 2) * y + 500]
      g.selectAll('path.link').data(links).enter().append('path').attr('fill', 'none').attr('stroke', (d: any) => manualBranchColors[d.target.data.id] || '#64748b').attr('d', d3.linkRadial<any, any>().angle((d: any) => xOf(d)).radius((d: any) => branchLengthMode === 'topology_only' ? d.depth * 80 : yOf(d)) as any)
      g.selectAll('circle.node').data(nodes).enter().append('circle').attr('cx', (d) => radialPoint(xOf(d), branchLengthMode === 'topology_only' ? d.depth * 80 : yOf(d))[0]).attr('cy', (d) => radialPoint(xOf(d), branchLengthMode === 'topology_only' ? d.depth * 80 : yOf(d))[1]).attr('r', 4).attr('fill', (d) => manualNodeColors[d.data.id] || '#334155').on('click', (_, d) => { if (!d.data.is_leaf) toggleCollapse(d.data.id); setSelected(d.data) })
      return
    }

    d3.tree<any>().nodeSize([24, layoutMode === 'straight' ? 130 : 180])(root)
    const nodes = root.descendants(); const links = root.links()
    const matched = new Set(nodes.filter((n) => n.data.is_leaf && search && n.data.name.toLowerCase().includes(search.toLowerCase())).map((n) => n))
    const pathSet = new Set<any>(); matched.forEach((n) => { let c: any = n; while (c) { pathSet.add(c); c = c.parent } })
    const linkGen = layoutMode === 'straight' ? d3.linkHorizontal<any, any>().x((d: any) => (branchLengthMode === 'topology_only' ? d.depth * 140 : yOf(d)) + 20).y((d: any) => xOf(d) + 20)
      : d3.linkHorizontal<any, any>().x((d: any) => (branchLengthMode === 'topology_only' ? d.depth * 180 : yOf(d)) + 20).y((d: any) => xOf(d) + 20)
    g.selectAll('path.link').data(links).enter().append('path').attr('fill', 'none').attr('stroke-width', layoutMode === 'curved' ? 2 : 1.5).attr('stroke', (d: any) => manualBranchColors[d.target.data.id] || (pathSet.has(d.target) ? '#dc2626' : '#64748b')).attr('d', linkGen as any)
    g.selectAll('circle.node').data(nodes).enter().append('circle').attr('cx', (d) => (branchLengthMode === 'topology_only' ? d.depth * (layoutMode === 'straight' ? 140 : 180) : yOf(d)) + 20).attr('cy', (d) => xOf(d) + 20).attr('r', 4).attr('fill', (d) => {
      const manual = manualNodeColors[d.data.id]; if (manual) return manual
      if (!d.data.is_leaf) return '#0f172a'
      const v = colorColumn && d.data.metadata ? String(d.data.metadata[colorColumn] ?? '') : ''
      return v ? String(colorScale(v)) : '#334155'
    }).on('click', (_, d) => { if (!d.data.is_leaf) toggleCollapse(d.data.id); setSelected(d.data) })
    g.selectAll('text.label').data(nodes.filter((n) => n.data.is_leaf)).enter().append('text').attr('x', (d) => (branchLengthMode === 'topology_only' ? d.depth * (layoutMode === 'straight' ? 140 : 180) : yOf(d)) + 28).attr('y', (d) => xOf(d) + 24).text((d) => d.data.name).attr('font-size', 12).attr('fill', (d) => (pathSet.has(d) ? '#b91c1c' : '#0f172a'))
  }, [tree, search, colorColumn, setSelected, toggleCollapse, colorScale, manualNodeColors, manualBranchColors, layoutMode, branchLengthMode])

  const cols = tree ? Array.from(flattenMetadataColumns(tree)).filter((c) => c !== 'id') : []
  return <div className='h-full w-full'><div className='p-2 text-sm'>Metadata color: <select className='border rounded-lg ml-2 px-1 py-0.5' value={colorColumn} onChange={(e) => useStore.getState().setColorColumn(e.target.value)}><option value=''>None</option>{cols.map((c) => <option key={c}>{c}</option>)}</select></div><svg ref={svgRef} className='w-full h-[calc(100%-40px)] bg-white border rounded-b-xl' /></div>
}
