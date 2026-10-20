import React, {createElement, useContext, useState} from 'react';
import type {ContentNode} from '../types';
import {asset,assetSet,mediaStyle} from '../lib/assets';
import {Carousel} from './Carousel';
import {CarouselContext} from './CarouselState';
import {useSite} from './SiteState';
import {FacultyList, FacultyFilters, ThrustFaculty, ThrustDirectory, CareersTable, SearchResults, ArchiveResults} from './DynamicContent';

const names:Record<string,string>={class:'className',for:'htmlFor',tabindex:'tabIndex',readonly:'readOnly',autoplay:'autoPlay',playsinline:'playsInline',srcset:'srcSet',colspan:'colSpan',rowspan:'rowSpan',cellpadding:'cellPadding',cellspacing:'cellSpacing',frameborder:'frameBorder',allowfullscreen:'allowFullScreen',viewbox:'viewBox',preserveaspectratio:'preserveAspectRatio','stroke-width':'strokeWidth','stroke-dasharray':'strokeDasharray','stroke-dashoffset':'strokeDashoffset','fill-rule':'fillRule','clip-rule':'clipRule','xmlns:xlink':'xmlnsXlink','xlink:href':'xlinkHref',crossorigin:'crossOrigin',contenteditable:'contentEditable',referrerpolicy:'referrerPolicy',fetchpriority:'fetchPriority',datetime:'dateTime',maxlength:'maxLength','http-equiv':'httpEquiv'};
const booleans=new Set(['autoplay','controls','muted','loop','playsinline','hidden','disabled','required','multiple','checked','selected','readonly','allowfullscreen','reversed','open','download']);
const voids=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const styleCache=new Map<string,React.CSSProperties>();
function style(value:string){
 if(styleCache.has(value))return styleCache.get(value);
 const element=document.createElement('span');element.style.cssText=mediaStyle(value);
 const result:Record<string,string>={};for(const key of Array.from(element.style)){const name=key.startsWith('--')?key:key.replace(/-([a-z])/g,(_m,c)=>c.toUpperCase()).replace(/^ms-/,'ms');result[name]=element.style.getPropertyValue(key);}
 styleCache.set(value,result);return result;
}
export function propsFor(attrs:Record<string,string>){
 const props:Record<string,any>={};
 for(const [key,value] of Object.entries(attrs)){
  if(key.startsWith('on') || key==='selected')continue;
  if(key==='ref'){props['data-content-ref']=value;continue;}
  const name=names[key]||key;
  if(key==='style')props.style=style(value);
  else if(['src','poster','background'].includes(key))props[name]=asset(value);
  else if(key==='srcset')props.srcSet=assetSet(value);
  else if(key==='href')props.href=value.startsWith('javascript:')?'#':asset(value);
  else if(key==='checked')props.defaultChecked=true;
  else if(booleans.has(key))props[name]=key==='download'&&value?value:true;
  else props[name]=value;
 }
 if(props.value!==undefined && !['option','progress'].includes(attrs['data-tag']||'')){props.defaultValue=props.value;delete props.value;}
 return props;
}
export function Nodes({nodes,trail=''}:{nodes:ContentNode[];trail?:string}){const counts:Record<string,number>={};return <>{nodes.map((node,i)=>{const key=typeof node==='string'?'text':node.tag+':'+(node.attrs.class||'').replace(/\bshow\b/g,'').trim();const ordinal=counts[key]||0;counts[key]=ordinal+1;return <Node key={i} node={node} trail={trail} index={ordinal}/>;})}</>;}
function Expandable({node,trail,index}:{node:Exclude<ContentNode,string>;trail:string;index:number}){
 const classes=node.attrs.class||'';const cohort=classes.includes('content_cohort');
 const [open,setOpen]=useState(classes.split(' ').includes('expand')||(cohort&&index===0));
 const leadership=node.children.some(c=>typeof c!=='string'&&c.attrs.class?.includes('detail_btn'));
 const group=classes.includes('is-vertical');
 function patch(n:ContentNode):ContentNode{
  if(typeof n==='string')return n;
  const cls=n.attrs.class||'';const body=/(^|\s)(card_body|cohort_body|expand_content|intro)(\s|$)/.test(cls);
  return {...n,attrs:{...n.attrs,...(body?{style:(n.attrs.style||'')+';height:'+(open?'auto':'0')+';overflow:hidden;'}:{}),...(group&&cls.includes('item_head')?{class:cls+(open?' expanded':'')}: {})},children:n.children.map(patch)};
 }
 const clone=patch(node) as Exclude<ContentNode,string>;clone.attrs={...clone.attrs,'data-react-expandable':'true',class:classes.replace(/\b(expand|expanded)\b/g,'')+(open?(leadership?' expanded':' expand'):'')};
 return <div className="react-expandable-shell" style={{display:'contents'}} onClick={e=>{if((e.target as HTMLElement).closest('.card_header,.cohort_header,.item_head,.detail_btn')){e.preventDefault();e.stopPropagation();setOpen(v=>!v);}}}><Node node={clone} trail={trail} index={index}/></div>;
}
export function Node({node,trail='',index=0}:{node:ContentNode;trail?:string;index?:number}):React.ReactNode{
 const state=useSite();
 const carousel=useContext(CarouselContext);
 if(typeof node==='string')return node;
 const {tag,attrs,children}=node;
 const cls=attrs.class||'';const has=(s:string)=>cls.split(/\s+/).includes(s);
 const next=trail+' '+cls;
 if(tag==='script'||tag==='noscript')return null;
 if(tag==='ul'&&trail.includes('news-list-wrap'))return <ArchiveResults node={node}/>;
 if(!attrs['data-react-expandable']&&(has('content_cohort')||(has('content_card')&&(trail.includes('curriculum')||trail.includes('can-expand')))||has('is-vertical')||children.some(c=>typeof c!=='string'&&c.attrs.class?.includes('detail_btn'))))return <Expandable node={node} trail={trail} index={index}/>;
 if(has('faculty-info-box')&&state.page.kind==='faculty')return <FacultyList/>;
 if(has('page-content-1200')&&trail.includes('content_area faculty'))return <ThrustDirectory/>;
 if(has('search-bar')&&state.page.kind==='faculty')return <FacultyFilters node={node}/>;
 if(has('faculty_list'))return <ThrustFaculty node={node}/>;
 if(tag==='tbody'&&trail.includes('staff-hiring'))return <CareersTable/>;
 if(has('search_result')&&state.page.kind==='search')return <div className={cls}>Found {state.results.length} results for {state.searchQuery}</div>;
 if(has('result')&&state.page.kind==='search')return <SearchResults/>;
 if(has('swiper'))return <Carousel node={node} trail={trail}/>;
 const props=propsFor({...attrs,'data-tag':tag});delete props['data-tag'];
 if(tag==='option'){props.value=attrs.value;delete props.defaultValue;}
 if(tag==='video'){props.muted=true;props.playsInline=true;props.onLoadedData=(e:React.SyntheticEvent<HTMLVideoElement>)=>{if(attrs.autoplay!==undefined)e.currentTarget.play().catch(()=>{});};}
 if(has('header-wrap'))props.className=cls+(state.scrolled?' in':'');
 if(has('header-desktop'))props.className=cls+(state.scrolled&&state.down?' in':'');
 if(has('drawer'))props.className='drawer '+(state.drawer?'open':'close');
 if(has('has-search-wrapper'))props.className=cls+(state.searchOpen?' active':'');
 if(has('menu-search-wrapper')||has('header-mobile-menu-bg'))props.className=cls+(state.mobileOpen?' active':'');
 if(has('fixed-button'))props.className=cls+(state.scrolled?' active':'');
 if(has('has-search')){props.onClick=()=>state.setSearchOpen(!state.searchOpen);props.role='button';props.tabIndex=0;}
 if(has('has-search-bg'))props.onClick=()=>state.setSearchOpen(false);
 if(trail.includes('has-search')&&has('iconfont'))props.className=cls.replace(/icon-(sousuo|cha)/,'icon-'+(state.searchOpen?'cha':'sousuo'));
 if(has('drawer-toggle')){props.onClick=()=>state.setDrawer(!state.drawer);props.role='button';props.tabIndex=0;props['aria-expanded']=state.drawer;}
 if(has('menu-button-mobile')){props.onClick=()=>state.setMobileOpen(true);props.role='button';props.tabIndex=0;props['aria-label']='Open menu';}
 if(has('menu-mobile-coles')||has('header-mobile-menu-bg'))props.onClick=()=>state.setMobileOpen(false);
 if(has('menu-item-has-children')&&window.innerWidth<=1200){props.className=cls+(state.menuItem===attrs.id?' mobile-expanded':'');props.onClick=(e:React.MouseEvent)=>{if((e.target as HTMLElement).closest('a')?.parentElement?.id===attrs.id&&state.menuItem!==attrs.id){e.preventDefault();state.setMenuItem(attrs.id);}};}
 if(has('scroll-icon'))props.onClick=(e:React.MouseEvent)=>{e.preventDefault();document.querySelector('#content_start,.programs-wrap')?.scrollIntoView({behavior:'smooth'});};
 if(has('to-top'))props.onClick=(e:React.MouseEvent)=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});};
 if(attrs['data-navigate'])props.onClick=()=>{const url=attrs['data-navigate'];if(url==='##new_tab'||url==='#')return;if(attrs['data-target']==='_blank')window.open(url,'_blank','noopener');else state.navigate(url);};
 if(attrs['data-scroll'])props.onClick=(e:React.MouseEvent)=>{e.preventDefault();document.getElementById(attrs['data-scroll'].slice(1))?.scrollIntoView({behavior:'smooth'});};
 const archiveSearch=()=>{const keyword=document.querySelector<HTMLInputElement>('#kw')?.value||'';state.navigate(state.page.path+'?keyword='+encodeURIComponent(keyword));};
 if(attrs.id==='kw'){props.defaultValue=new URLSearchParams(window.location.search).get('keyword')||'';props.onKeyDown=(e:React.KeyboardEvent)=>{if(e.key==='Enter'){e.preventDefault();archiveSearch();}};}
 if(has('search_icon'))props.onClick=archiveSearch;
 if(attrs.id==='tagApply_btn')props.onClick=()=>{const labels=Array.from(document.querySelectorAll<HTMLInputElement>('.choices input:checked')).map(e=>document.querySelector<HTMLLabelElement>(`label[for="${e.id}"]`)?.textContent?.trim()||'').filter(Boolean);state.navigate(state.page.path+'?tags='+encodeURIComponent(labels.join(',')));};
 if(has('pagination')&&new URLSearchParams(window.location.search).size)props.style={...props.style,display:'none'};
 if(has('tab-title')&&trail.includes('programs-l'))props.onClick=(e:React.MouseEvent)=>{e.preventDefault();state.setProgramTab(index);};
 if(has('programs-m'))props.style={...props.style,display:index===state.programTab?'':'none'};
 if(tag==='li'&&trail.includes('academics-wrap')&&trail.includes('nav-tabs'))props.onMouseEnter=()=>state.setAcademicTab(index);
 if(tag==='img'&&trail.includes('academics-r'))props.className=(cls.replace(/\bshow\b/g,'')+(index===state.academicTab?' show':''));
 if(attrs.id==='playButton'){props.className='play-button '+(state.playing?'paused':'play');props.onClick=()=>state.setPlaying(!state.playing);props.role='button';props.tabIndex=0;props['aria-label']=state.playing?'Pause slideshow':'Play slideshow';}
 if(has('swiper-pagination')&&trail.includes('swiper-control'))return <div className={cls}><span>{String(state.slide+1).padStart(2,'0')}</span> / <span>{String(state.slideTotal).padStart(2,'0')}</span></div>;
 if(has('swiper-pagination')&&carousel)return <div className={cls+' swiper-pagination-clickable swiper-pagination-bullets swiper-pagination-horizontal'}>{Array.from({length:carousel.total},(_,i)=><span key={i} className={'swiper-pagination-bullet'+(carousel.index===i?' swiper-pagination-bullet-active':'')} role="button" tabIndex={0} aria-label={'Go to slide '+(i+1)} onClick={()=>carousel.swiper?.slideTo(i)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();carousel.swiper?.slideTo(i);}}}/>)}</div>;
 if(has('swiper-button-prev')&&trail.includes('swiper-control'))props.onClick=()=>state.hero?.slidePrev();
 if(has('swiper-button-next')&&trail.includes('swiper-control'))props.onClick=()=>state.hero?.slideNext();
 if((has('swiper-button-prev')||has('swiper-button-next'))&&!trail.includes('swiper-control'))props.onClick=(e:React.MouseEvent)=>{const container=(e.currentTarget as HTMLElement).closest('.center-area,.news-swiper-box,.staff-words,.swiper');const swiper=(container?.querySelector('.swiper')||container) as HTMLElement&{swiper?:{slideNext:()=>void;slidePrev:()=>void}};if(has('swiper-button-next'))swiper?.swiper?.slideNext();else swiper?.swiper?.slidePrev();};
 if(carousel&&(has('swiper-button-prev')||has('swiper-button-next'))){props.onClick=()=>has('swiper-button-next')?carousel.swiper?.slideNext():carousel.swiper?.slidePrev();const disabled=!carousel.swiper?.params.loop&&(has('swiper-button-prev')?carousel.swiper?.isBeginning:carousel.swiper?.isEnd);props.className=cls+(disabled?' swiper-button-disabled':'');props['aria-disabled']=!!disabled;}
 if(has('swiper-button-prev')||has('swiper-button-next')){props.role='button';props.tabIndex=0;props['aria-label']=has('swiper-button-prev')?'Previous slide':'Next slide';}
 if(tag==='form'&&(attrs.id==='searchform'||children.some(c=>typeof c!=='string'&&c.attrs?.name==='s')))props.onSubmit=(e:React.FormEvent<HTMLFormElement>)=>{e.preventDefault();const q=new FormData(e.currentTarget).get('s')?.toString()||'';state.setSearchOpen(false);state.navigate('/?s='+encodeURIComponent(q));};
 if(tag==='a'&&!props.onClick&&props.href?.startsWith('/')&&!props.target&&!/^\/(wp-content|wp-includes|__local|__external|__long)\//.test(props.href))props.onClick=(e:React.MouseEvent)=>{if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.shiftKey||e.button!==0)return;e.preventDefault();const parent=e.currentTarget.parentElement;if(window.innerWidth<=1200&&parent?.classList.contains('menu-item-has-children')&&state.menuItem!==parent.id){state.setMenuItem(parent.id);return;}state.navigate(props.href);};
 if(props.role==='button')props.onKeyDown=(e:React.KeyboardEvent)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();props.onClick?.(e);}};
 if(voids.has(tag))return createElement(tag,props);
 const Tag=tag==='animatetransform'?'animateTransform':tag;
 return createElement(Tag,props,<Nodes nodes={children} trail={next}/>);
}
