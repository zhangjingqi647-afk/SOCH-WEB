import fs from 'node:fs';
const values=['.env','.env.local','.env.production','.env.production.local'].filter(f=>fs.existsSync(f)).map(f=>fs.readFileSync(f,'utf8')).join('\n');
const value=process.env.VITE_ASSET_BASE_URL || [...values.matchAll(/^VITE_ASSET_BASE_URL\s*=\s*(.+)$/gm)].at(-1)?.[1]?.replace(/^['"]|['"]$/g,'');
if(!value || !/^https:\/\//.test(value)){console.error('Set VITE_ASSET_BASE_URL=https://your-public-r2-domain before building for Cloudflare.');process.exit(1);}
