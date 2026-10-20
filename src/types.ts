export type ContentNode = string | { tag: string; attrs: Record<string,string>; children: ContentNode[] };
export interface PageData {path:string;title:string;lang:string;mainAttrs:Record<string,string>;header?:string;footer?:string;content:ContentNode[];styles:string[];inlineStyles:string[];status:number;kind:string}
export interface RouteRecord {path:string;file:string;title:string;kind:string;status:number;lang:string}
export interface Faculty {id:string;enName:string;name:string;email:string;photoUrl:string;title:string;thrustList:string[];departments:string[]}
