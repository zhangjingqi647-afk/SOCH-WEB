import {createContext} from 'react';
import type {Swiper} from 'swiper';

export const CarouselContext = createContext<{
  swiper: Swiper | null;
  index: number;
  total: number;
} | null>(null);
