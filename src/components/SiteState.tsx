import {createContext,useContext,type Dispatch,type SetStateAction} from 'react';
import type {NavigateFunction} from 'react-router-dom';
import type {Swiper} from 'swiper';
import type {PageData} from '../types';
type Setter<T>=Dispatch<SetStateAction<T>>;
export interface SearchRecord{path:string;title:string;text:string;date?:string}
export interface SiteState{page:PageData;navigate:NavigateFunction;scrolled:boolean;down:boolean;drawer:boolean;setDrawer:Setter<boolean>;searchOpen:boolean;setSearchOpen:Setter<boolean>;mobileOpen:boolean;setMobileOpen:Setter<boolean>;menuItem:string;setMenuItem:Setter<string>;programTab:number;setProgramTab:Setter<number>;academicTab:number;setAcademicTab:Setter<number>;playing:boolean;setPlaying:Setter<boolean>;slide:number;setSlide:Setter<number>;slideTotal:number;setSlideTotal:Setter<number>;hero:Swiper|null;setHero:Setter<Swiper|null>;searchQuery:string;results:SearchRecord[];department:string;setDepartment:Setter<string>;keyword:string;setKeyword:Setter<string>;titleFilter:string;setTitleFilter:Setter<string>}
export const SiteContext=createContext<SiteState>(null!);
export const useSite=()=>useContext(SiteContext);
