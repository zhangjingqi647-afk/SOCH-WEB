import {Component,useEffect,useState,useMemo,type ReactNode} from 'react';
import {BrowserRouter,useLocation,useNavigate} from 'react-router-dom';
import type {Swiper} from 'swiper';
import type {ContentNode,PageData,RouteRecord} from './types';
import {SiteContext,type SearchRecord} from './components/SiteState';
import {getContent} from './components/DynamicContent';
import {Nodes,propsFor} from './components/ContentTree';
import {mediaStyle} from './lib/assets';

interface Loaded{page:PageData;header:ContentNode[];footer:ContentNode[];index:SearchRecord[]}
function canonical(path:string){try{path=decodeURIComponent(path);}catch{}return path.endsWith('/')||/\.[a-z0-9]+$/i.test(path)?path:path+'/';}
function Application(){
 const location=useLocation();const navigate=useNavigate();const [loaded,setLoaded]=useState<Loaded|null>(null);const[error,setError]=useState('');
 const query=new URLSearchParams(location.search).get('s');
 useEffect(()=>{let alive=true;setLoaded(null);setError('');(async()=>{
  const routes=await getContent<RouteRecord[]>('/content/routes.json');const route=routes.find(r=>canonical(r.path)===canonical(location.pathname));
  if(!route&&query===null){throw new Error('404 — Page not found');}
  const page=await getContent<PageData>(query!==null?'/content/search-page.json':route!.file);
  const [header,footer,index]=await Promise.all([page.header?getContent<ContentNode>('/content/shared/'+page.header+'.json'):null,page.footer?getContent<ContentNode>('/content/shared/'+page.footer+'.json'):null,query!==null?getContent<SearchRecord[]>('/content/search.json'):[]]);
  // Wait for original stylesheet metrics before revealing the page.
  await Promise.all(page.styles.map(href=>new Promise<void>(resolve=>{let link=document.querySelector<HTMLLinkElement>(`link[data-page-style="${href}"]`);if(link){resolve();return;}link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.pageStyle=href;link.onload=()=>resolve();link.onerror=()=>resolve();document.head.appendChild(link);})));
  if(alive){document.querySelectorAll<HTMLLinkElement>('link[data-page-style]').forEach(l=>{if(!page.styles.includes(l.dataset.pageStyle!))l.remove();});setLoaded({page,header:header?[header]:[],footer:footer?[footer]:[],index});}
 })().catch(e=>{if(alive)setError(e.message);});return()=>{alive=false;};},[location.pathname,query]);
 if(error)return <main className="react-status"><h1>{error}</h1><a href="/">Return home</a><button onClick={()=>window.location.reload()}>Retry</button></main>;
 if(!loaded)return <div className="react-loading" role="status" aria-label="Loading page"/>;
 return <PageBoundary key={location.key}><Site loaded={loaded} navigate={navigate} searchQuery={query||''} hash={location.hash}/></PageBoundary>;
}
class PageBoundary extends Component<{children:ReactNode},{error:string}>{
 state={error:''};
 static getDerivedStateFromError(error:Error){return {error:error.message};}
 render(){return this.state.error?<main className="react-status"><h1>This page could not be displayed.</h1><p>{this.state.error}</p><a href="/">Return home</a><button onClick={()=>window.location.reload()}>Retry</button></main>:this.props.children;}
}
function Site({loaded,navigate,searchQuery,hash}:{loaded:Loaded;navigate:ReturnType<typeof useNavigate>;searchQuery:string;hash:string}){
 const {page,header,footer,index}=loaded;
 const [scrolled,setScrolled]=useState(false),[down,setDown]=useState(false),[drawer,setDrawer]=useState(false),[searchOpen,setSearchOpen]=useState(false),[mobileOpen,setMobileOpen]=useState(false),[menuItem,setMenuItem]=useState('');
 const [programTab,setProgramTab]=useState(0),[academicTab,setAcademicTab]=useState(0),[playing,setPlaying]=useState(true),[slide,setSlide]=useState(0),[slideTotal,setSlideTotal]=useState(8),[hero,setHero]=useState<Swiper|null>(null);
 const [department,setDepartment]=useState(''),[keyword,setKeyword]=useState(''),[titleFilter,setTitleFilter]=useState('');
 const results=useMemo(()=>{const words=searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);const date=(p:SearchRecord)=>p.date||p.path.slice(1,11).replaceAll('/','-');return index.filter(p=>(/^\/\d{4}\//.test(p.path)||p.date)&&words.length&&words.every(w=>(p.title+' '+p.text).toLowerCase().includes(w))).sort((a,b)=>date(b).localeCompare(date(a)));},[index,searchQuery]);
 useEffect(()=>{
  document.title=page.title;document.documentElement.lang=page.lang||'en';
  const resize=()=>{const w=window.innerWidth;document.documentElement.style.fontSize=(Math.min(w,1600)*100/(w<=910?750:1920))+'px';};resize();window.addEventListener('resize',resize);
  let previous=window.scrollY;const scroll=()=>{setScrolled(window.scrollY>40);setDown(window.scrollY>previous);previous=window.scrollY;};window.addEventListener('scroll',scroll,{passive:true});
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('active',e.isIntersecting)),{threshold:0});
  document.querySelectorAll('[class*="transitionRight"],[class*="transitionBottom"],.transitionLable').forEach(e=>observer.observe(e));
  const changes=new MutationObserver(records=>records.forEach(r=>r.addedNodes.forEach(n=>{if(n instanceof Element){if(n.matches('[class*="transitionRight"],[class*="transitionBottom"],.transitionLable'))observer.observe(n);n.querySelectorAll('[class*="transitionRight"],[class*="transitionBottom"],.transitionLable').forEach(e=>observer.observe(e));}})));
  changes.observe(document.getElementById('root')!,{childList:true,subtree:true});
  const timer=setInterval(()=>setAcademicTab(t=>(t+1)%4),5000);
  const target=hash?document.getElementById(decodeURIComponent(hash.slice(1))):null;
  if(target)requestAnimationFrame(()=>target.scrollIntoView());else window.scrollTo(0,0);
  return()=>{window.removeEventListener('resize',resize);window.removeEventListener('scroll',scroll);observer.disconnect();changes.disconnect();clearInterval(timer);document.documentElement.classList.remove('hidden');};
 },[page,hash]);
 useEffect(()=>{document.documentElement.classList.toggle('hidden',searchOpen||mobileOpen);if(searchOpen)setTimeout(()=>document.querySelector<HTMLInputElement>('.has-search-wrapper.active input')?.focus(),100);},[searchOpen,mobileOpen]);
 useEffect(()=>{const escape=(e:KeyboardEvent)=>{if(e.key==='Escape'){setMobileOpen(false);setSearchOpen(false);setDrawer(false);}};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape);},[]);
 return <SiteContext.Provider value={{page,navigate,scrolled,down,drawer,setDrawer,searchOpen,setSearchOpen,mobileOpen,setMobileOpen,menuItem,setMenuItem,programTab,setProgramTab,academicTab,setAcademicTab,playing,setPlaying,slide,setSlide,slideTotal,setSlideTotal,hero,setHero,searchQuery,results,department,setDepartment,keyword,setKeyword,titleFilter,setTitleFilter}}>
  {page.inlineStyles.map((css,i)=><style key={i}>{mediaStyle(css)}</style>)}
  <div {...propsFor(page.mainAttrs)}><Header nodes={header}/><PageContent page={page}/><Footer nodes={footer}/></div>
 </SiteContext.Provider>;
}
function Header({nodes}:{nodes:ContentNode[]}){return <Nodes nodes={nodes}/>;}
function Footer({nodes}:{nodes:ContentNode[]}){return <Nodes nodes={nodes}/>;}
function HomePage({page}:{page:PageData}){return <Nodes nodes={page.content}/>;}
function ArticlePage({page}:{page:PageData}){return <Nodes nodes={page.content}/>;}
function SectionPage({page}:{page:PageData}){return <Nodes nodes={page.content}/>;}
function PageContent({page}:{page:PageData}){return page.kind==='home'?<HomePage page={page}/>:page.kind==='article'?<ArticlePage page={page}/>:<SectionPage page={page}/>;}
export default function App(){return <BrowserRouter><Application/></BrowserRouter>;}
