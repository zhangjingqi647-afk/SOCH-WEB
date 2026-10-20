const base=(import.meta.env.VITE_ASSET_BASE_URL || '').replace(/\/$/,'');
export function asset(url:string):string{return /^\/(wp-content|wp-includes|__local\/photos|__external|__long)\//.test(url)?base+url:url;}
export function assetSet(value:string){return value.split(',').map(part=>part.trim().split(/\s+/).map((v,i)=>i===0?asset(v):v).join(' ')).join(', ');}
export function mediaStyle(value:string){return value.replace(/url\((['"]?)(\/[^)]*?)\1\)/g,(_m,q,url)=>`url(${q}${asset(url)}${q})`);}
