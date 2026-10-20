import {useEffect, useState} from 'react';
import {Swiper, SwiperSlide} from 'swiper/react';
import {Autoplay, EffectFade} from 'swiper/modules';
import type {Swiper as SwiperInstance} from 'swiper';
import type {ContentNode} from '../types';
import {Nodes, propsFor} from './ContentTree';
import {useSite} from './SiteState';
import {CarouselContext} from './CarouselState';

export function Carousel({node, trail}: {node: Exclude<ContentNode, string>; trail: string}) {
  const state = useSite();
  const [instance, setInstance] = useState<SwiperInstance | null>(null);
  const [index, setIndex] = useState(0);
  const hero = trail.includes('home-banner');
  const center = trail.includes('center-area');
  const news = trail.includes('news-swiper');
  const wrapper = node.children.find(c => typeof c !== 'string' && c.attrs.class?.split(' ').includes('swiper-wrapper'));
  const slides = typeof wrapper === 'object'
    ? wrapper.children.filter((c): c is Exclude<ContentNode, string> => typeof c !== 'string' && !!c.attrs.class?.includes('swiper-slide'))
    : [];
  const controls = node.children.filter(c => c !== wrapper);

  useEffect(() => {
    if (!hero) return;
    state.setSlideTotal(slides.length);
    return () => state.setHero(null);
  }, [hero, slides.length]);

  useEffect(() => {
    if (!hero || !instance || instance.destroyed) return;
    state.playing ? instance.autoplay.start() : instance.autoplay.stop();
    instance.el.querySelectorAll('video').forEach(video => {
      if (state.playing && video.closest('.swiper-slide-active')) video.play().catch(() => {});
      else video.pause();
    });
  }, [state.playing, hero, instance]);

  return <CarouselContext.Provider value={{swiper: instance, index, total: slides.length}}>
    <Swiper
      {...propsFor(node.attrs)}
      modules={[Autoplay, EffectFade]}
      loop={!center && !news && slides.length > 1}
      effect={hero ? 'fade' : 'slide'}
      fadeEffect={{crossFade: true}}
      slidesPerView={center ? 'auto' : 1}
      spaceBetween={center ? 14 : news ? 10 : 2}
      breakpoints={center ? {910: {slidesPerView: 4, spaceBetween: 20}} : undefined}
      autoplay={center ? false : {delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: !hero}}
      onSwiper={swiper => {setInstance(swiper); if (hero) state.setHero(swiper);}}
      onSlideChange={swiper => {
        setIndex(swiper.realIndex);
        if (hero) state.setSlide(swiper.realIndex);
        swiper.el.querySelectorAll('video').forEach(video => {
          if (video.closest('.swiper-slide-active') && (!hero || state.playing)) {
            video.currentTime = 0;
            video.play().catch(() => {});
          } else video.pause();
        });
      }}
      onAutoplayTimeLeft={(_swiper, _time, progress) => {
        if (hero) document.getElementById('progress-animate')?.setAttribute('stroke-dashoffset', String(62.83 * progress));
      }}
    >
      {slides.map((slide, i) => <SwiperSlide key={i} {...propsFor(slide.attrs)}>
        <Nodes nodes={slide.children} trail={trail + ' ' + node.attrs.class + ' swiper-slide'}/>
      </SwiperSlide>)}
      <Nodes nodes={controls} trail={trail + ' ' + node.attrs.class}/>
    </Swiper>
  </CarouselContext.Provider>;
}
