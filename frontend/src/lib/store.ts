import { create } from 'zustand'
import type { TreeNode } from './types'

type S={tree:TreeNode|null;selected:TreeNode|null;search:string;colorColumn:string;setTree:(t:TreeNode)=>void;setSelected:(n:TreeNode|null)=>void;setSearch:(s:string)=>void;setColorColumn:(c:string)=>void}
export const useStore=create<S>((set)=>({tree:null,selected:null,search:'',colorColumn:'',setTree:(tree)=>set({tree}),setSelected:(selected)=>set({selected}),setSearch:(search)=>set({search}),setColorColumn:(colorColumn)=>set({colorColumn})}))
