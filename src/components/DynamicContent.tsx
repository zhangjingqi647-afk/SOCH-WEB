import {Fragment,useEffect,useMemo,useState} from 'react';
import type {ContentNode,Faculty} from '../types';
import {asset} from '../lib/assets';
import {useSite} from './SiteState';
import {Nodes,propsFor} from './ContentTree';
import {useLocation} from 'react-router-dom';

export const departments:Record<string,string>={FTEC:'10011A10000000000H2S',IPE:'10011A10000000000H2U',UGOD:'10011A10000000000H2Y',CNCC:'10011A100000000259HQ'};
const cache=new Map<string,Promise<any>>();
export function getContent<T>(url:string):Promise<T>{if(!cache.has(url))cache.set(url,fetch(url).then(r=>{if(!r.ok)throw new Error(`Content unavailable: ${url}`);return r.json();}).catch(e=>{cache.delete(url);throw e;}));return cache.get(url)!;}
export function useContent<T>(url:string){const [value,setValue]=useState<T|null>(null);const[error,setError]=useState('');useEffect(()=>{let alive=true;setValue(null);setError('');getContent<T>(url).then(v=>{if(alive)setValue(v);}).catch(e=>{if(alive)setError(e.message);});return()=>{alive=false;};},[url]);return {value,error};}
function useFaculty(){const {value,error}=useContent<Faculty[]>('/content/faculty.json');return {people:value||[],error};}
export function FacultyFilters({node}:{node:Exclude<ContentNode,string>}){
 const state=useSite();const {people}=useFaculty();const [input,setInput]=useState(state.keyword);
 const names:Record<string,string>={CNCC:'Carbon Neutrality and Climate Change',FTEC:'Financial Technology',IPE:'Innovation, Policy and Entrepreneurship',UGOD:'Urban Governance and Design'};
 const titles=['Chair Professor','Professor','Associate Professor','Assistant Professor'].filter(t=>people.some(p=>p.title===t));
 return <div {...propsFor(node.attrs)}><div className="search-bar-wrap"><form className="search-bar-box" onSubmit={e=>{e.preventDefault();state.setKeyword(input);}}>
  <input className="keyword-input" type="text" name="keyword" id="keyword" placeholder="Search by Name" value={input} onChange={e=>setInput(e.target.value)}/><button aria-label="Search faculty" className="icon icon-search react-search-icon" type="submit"/>
  <div className="selector-wrap"><div className="selector"><select className="title-portal" id="thrustInput" aria-label="Thrust" value={state.department} onChange={e=>{state.setDepartment(e.target.value);state.setTitleFilter('');}}><option value="">Thrust</option>{Object.entries(names).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><span className="icon icon-drop"/></div><div className="selector"><select className="title-portal" id="titleInput" aria-label="Title" value={state.titleFilter} onChange={e=>state.setTitleFilter(e.target.value)}><option value="">Title</option>{titles.map(t=><option key={t}>{t}</option>)}</select><span className="icon icon-drop"/></div></div>
 </form></div></div>;
}
export function FacultyList(){
 const state=useSite();const {people,error}=useFaculty();
 const {value:ids}=useContent<string[]>('/content/profile-'+(departments[state.department]||departments.FTEC)+'.json');
 const filtered=people.filter(p=>(!state.department||(ids||[]).includes(p.id))&&(!state.keyword||(p.enName+' '+p.name).toLowerCase().includes(state.keyword.toLowerCase()))&&(!state.titleFilter||p.title===state.titleFilter));
 const pairs=Array.from({length:Math.ceil(filtered.length/2)},(_,i)=>filtered.slice(i*2,i*2+2));
 return <div className="faculty-info-box" aria-live="polite">{error?<p role="alert">{error}</p>:pairs.map((pair,i)=><Fragment key={i}>{i>0&&<div className="divider"/>}<div className="group">{pair.map(p=><div key={p.id} className="group-item transitionRight-0 active"><div className="animated-image"><img src={asset(p.photoUrl)} alt={p.enName} className="portrait" decoding="async" loading="lazy"/></div><div className="info-box"><div className="name">{p.enName}</div><div className="detail-box"><div className="detail-title">{p.title}</div>{p.thrustList.map((t,i)=><div className="detail-thrust" key={i}>{t}</div>)}<div className="detail-mail">{p.email}</div></div></div><div className="website"><a href={'https://facultyprofiles.hkust-gz.edu.cn/faculty-personal-page?id='+p.id} target="_blank" rel="noreferrer">more</a></div></div>)}</div></Fragment>)}{people.length>0&&filtered.length===0&&<p>No matching faculty.</p>}</div>;
}
export function ThrustFaculty({node}:{node:Exclude<ContentNode,string>}){
 const {page}=useSite();const key=page.path.split('/')[2]?.toUpperCase();const code=departments[key]||departments.FTEC;
 const {value}=useContent<any>('/content/thrust-'+code+'.json');
 const people=thrustGroups(value).find(g=>g.name==='Faculty')?.people||[];
 return <div {...propsFor(node.attrs)}>{node.children.map((child,i)=>typeof child!=='string'&&child.tag==='ul'?<ul key={i}>{people.slice(0,4).map(p=><li key={p.id}><div className="animated-image transitionRight-0 active"><div className="avatar" style={{backgroundImage:`url("${asset(p.photo?.[0]?.urlHost||'')}")`}}/></div><div className="name">{p.enName}</div><div className="title">{p.jobs?.[0]?.jobEnName}</div></li>)}</ul>:<Nodes key={i} nodes={[child]}/>)}</div>;
}
function thrustGroups(value:any){
 const categories=[{name:'Faculty',titles:['Chair Professor','Professor','Associate Professor','Assistant Professor','Research Associate Professor','Research Assistant Professor']},{name:'Adjunct/Visiting Faculty',titles:['Adjunct Chair Professor','Adjunct Professor','Adjunct Associate Professor','Adjunct Assistant Professor','Visiting Professor','Visiting Associate Professor','Visiting Assistant Professor']},{name:'Professor of Practice',titles:['Professor of Practice','Associate Professor of Practice','Assistant Professor of Practice']},{name:'Affiliated Faculty',titles:['Affiliate Chair Professor','Affiliate Professor','Affiliate Associate Professor','Affiliate Assistant Professor']},{name:'Others',titles:[]}].map(c=>({...c,people:[] as any[]}));
 const source=value?.data;if(!source)return categories;
 const all=[source.ACTING_HEAD,...(source.CURRENT_FACULTY_ADVISORS||[])].filter(Boolean);
 all.forEach((p,i)=>{const job=p.jobs?.find((j:any)=>j.campus==='gz'&&!j.jobEnName.includes('Head'))||p.jobs?.[0];const title=(job?.jobEnName||'').trim();const person={...p,title,photoUrl:p.photo?.[0]?.urlHost||'',thrustList:job?[job.departmentEnName]:[],isHead:i===0};const group=i===0?categories[0]:categories.find(c=>c.titles.includes(title))||categories[4];group.people.push(person);});
 categories.forEach(g=>g.people.sort((a,b)=>a.isHead?-1:b.isHead?1:g.titles.indexOf(a.title)-g.titles.indexOf(b.title)||(a.lastName||'').localeCompare(b.lastName||'')));
 return categories;
}
export function ThrustDirectory(){
 const {page}=useSite();const key=page.path.split('/')[2]?.toUpperCase();const code=departments[key]||departments.FTEC;const {value,error}=useContent<any>('/content/thrust-'+code+'.json');
 const heads:Record<string,string>={FTEC:'Head of Financial Technology Thrust',CNCC:'Acting Thrust Head of Carbon Neutrality and Climate Change Thrust',IPE:'Head of Innovation, Policy and Entrepreneurship Thrust',UGOD:'Head of Urban Governance and Design Thrust'};
 return <div className="page-content-1200">{error&&<p role="alert">{error}</p>}{thrustGroups(value).filter(g=>g.people.length).map((g,gi)=>{
  const rows:any[][]=[];g.people.forEach((p,i)=>{if(i===0||(gi===0?i%2===1:i%2===0))rows.push([]);rows[rows.length-1].push(p);});
  return <Fragment key={g.name}><div className="content_title">{g.name}</div><div className="faculty-info"><div className="faculty-info-wrap"><div className="faculty-info-box">{rows.map((row,i)=><Fragment key={i}>{i>0&&<div className="divider"/>}<div className="group">{row.map((p,pi)=><div className="group-item transitionRight-0 active" key={p.id+'-'+pi}><div className="animated-image"><img src={asset(p.photoUrl)} alt={p.enName} className="portrait" loading="lazy"/></div><div className="info-box"><div className="name">{p.enName}</div><div className="detail-box">{p.isHead&&<div className="head-title">{heads[key]}</div>}<div className="detail-title">{p.title}</div>{p.thrustList.map((t:string,i:number)=><div className="detail-thrust" key={i}>{t}</div>)}<div className="detail-mail">{p.email}</div></div></div><div className="website"><a href={'https://facultyprofiles.hkust-gz.edu.cn/faculty-personal-page?id='+p.id} target="_blank" rel="noreferrer">more</a></div></div>)}</div></Fragment>)}</div></div></div></Fragment>;
 })}</div>;
}
interface Job{id:string;jobType:number;source:number;postId:string;recruitType:number;jobid:string;postNameCh:string;enPostDept:string}
export function CareersTable(){
 const {page}=useSite();const {value,error}=useContent<{data:{hubCode:string;zpCareerList:Job[]}[]}>('/content/careers.json');
 const jobs=value?.data.find(d=>d.hubCode==='10011A10000000000H2Q')?.zpCareerList.filter(j=>page.path.includes('staff')?j.jobType===0:j.jobType!==0)||[];
 return <tbody>{error?<tr><td colSpan={4}>{error}</td></tr>:jobs.map(j=>{const url=j.source===0?`https://sc.hotjob.cn/wt/HKUSTGZ/web/index/webPositionN310!getOnePosition?postId=${j.postId}&recruitType=${j.recruitType}&brandCode=1&importPost=0&columnId=2`:`https://career.hkust-gz.edu.cn/en/job-detail?jobId=${j.id}`;return <tr className="row" key={j.id}>{[j.jobid,j.postNameCh,j.enPostDept,'Apply'].map((s,i)=><td key={i} className={['id rid','title htitle','dep hdep','apply'][i]}><a href={url} target="_blank" rel="noreferrer">{s}</a></td>)}</tr>;})}</tbody>;
}
export function SearchResults(){
 const {results,navigate}=useSite();const [page,setPage]=useState(1);useEffect(()=>setPage(1),[results]);
 const size=20;
 return <><ul className="result">{results.slice((page-1)*size,page*size).map(p=><li key={p.path}><a href={p.path} target={/^https?:/.test(p.path)?"_blank":undefined} rel={/^https?:/.test(p.path)?"noopener noreferrer":undefined} onClick={e=>{if(/^https?:/.test(p.path))return;e.preventDefault();navigate(p.path);}}><p className="title">{p.title}</p></a><div className="abstract"><p>{p.text.slice(0,700)}</p></div><p className="date">{p.date?p.date.split('-').reverse().join('.'):p.path.split('/').slice(1,4).reverse().join('.')}</p></li>)}</ul>{results.length>size&&<nav className="react-pagination" aria-label="Search pages"><button disabled={page===1} onClick={()=>setPage(page-1)}>Previous</button><span>{page} / {Math.ceil(results.length/size)}</span><button disabled={page*size>=results.length} onClick={()=>setPage(page+1)}>Next</button></nav>}</>;
}
export function ArchiveResults({node}:{node:Exclude<ContentNode,string>}){
 const {page}=useSite();const location=useLocation();const params=new URLSearchParams(location.search);
 const keyword=params.get('keyword')||'',date=params.get('date')||'',tags=(params.get('tags')||'').split(',').filter(Boolean);
 const {value}=useContent<Record<string,{node:ContentNode;text:string;href:string}[]>>('/content/archives.json');
 const key=page.path.replace(/\/page\/\d+\/$/,'/');
 const matching=(value?.[key]||[]).filter(item=>item.text.toLowerCase().includes(keyword.toLowerCase())&&(!tags.length||tags.some(t=>item.text.toLowerCase().includes(t.toLowerCase())))&&(!date||item.href.includes(date.replaceAll('-','/'))||item.text.includes(new Date(date+'T12:00:00').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}))));
 if(!keyword&&!date&&!tags.length)return <ul {...propsFor(node.attrs)}><Nodes nodes={node.children}/></ul>;
 return <ul {...propsFor(node.attrs)}>{matching.map((item,i)=><Nodes key={i} nodes={[item.node]}/>)}{value&&matching.length===0&&<li>No matching results.</li>}</ul>;
}

