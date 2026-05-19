export type TreeNode = { id:string; name:string; branch_length:number|null; children:TreeNode[]; is_leaf:boolean; metadata?:Record<string,unknown>|null; collapsed:boolean; _children?:TreeNode[] }
