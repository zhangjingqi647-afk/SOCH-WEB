const IndexFn = {

  // 标记动画是否已执行，避免重复触发
  animationExecuted: false,

  Init: function () {
    // this.IndexSwiper();
    this.BannerFn();
    this.OverviewFn();
    this.ProgramFn();
    this.AdmissionFn();
    this.MentorsSwiper();
    this.bindScrollEvent();
  },
  IndexSwiper: function () {
    const swiper = new Swiper(".swiper", {
      slidesPerView: "auto",
      spaceBetween: 20,
    });
  },
  OverviewFn: function () {
    const card = $(".overview .card");
    card.on("mouseenter", function () {
      card.removeClass("active");
      card.removeClass("not-active");
      $(this).addClass("active");
      card.not(this).addClass("not-active");

    });
    card.on("mouseleave", function () {
      card.removeClass("active");
      card.removeClass("not-active");
    });

    new Swiper('.overview .cards', {
      slidesPerView: "auto",
      spaceBetween: 16,
      // Navigation arrows
      navigation: {
        nextEl: '.overview .swiper-button-next',
        prevEl: '.overview .swiper-button-prev',
      },

    })
  },
  BannerFn: function () {
    new Swiper('.banner', {
      slidesPerView: "auto",
      spaceBetween: 0,
      loop: true,
      autoplay: {
        delay: 6000,
        pauseOnMouseEnter: true, // 鼠标悬停时暂停自动播放（true：暂停）
      },
      pagination: {
        el: '.banner .swiper-pagination',
      },

      // Navigation arrows
      navigation: {
        nextEl: '.banner .swiper-button-next',
        prevEl: '.banner .swiper-button-prev',
      },
    })
  },

  ProgramFn: function () {


    const card = $(".feature .card");
    card.on("mouseenter", function () {
      card.removeClass("active");
      $(this).addClass("active");
    });

    new Swiper(".feature .swiper", {
      slidesPerView: "auto",
      spaceBetween: 6,
      navigation: {
        nextEl: '.feature .swiper-button-next',
        prevEl: '.feature .swiper-button-prev',
      },
    });
  },
  AdmissionFn: function () {
    const card = $(".admission .list");
    card.removeClass("active");
    card.eq(0).addClass("active");
    card.on("mouseenter", function () {
      card.removeClass("active");
      $(this).addClass("active");
    });
  },
  MentorsSwiper: function () {
    const swiperConfig = {
      slidesPerView: "auto",
      // spaceBetween: 10,
      speed: 8000,//切换速度
      loop: true,
      // freeMode: true,
      autoplay: {
        delay: 1, // 自动播放间隔（ms，默认3000）
        stopOnLastSlide: false,
        disableOnInteraction: false, // 用户交互后是否停止自动播放（true：停止，false：继续）
        pauseOnMouseEnter: true, // 鼠标悬停时暂停自动播放（true：暂停）
      }
    }
    new Swiper(".mentor .mentors-swiper1", swiperConfig);
    new Swiper(".mentor .mentors-swiper2", swiperConfig);
    new Swiper(".mentor .mentors-swiper3", swiperConfig);
  },

  // 绑定滚动监听
  bindScrollEvent: function () {
    const _this = this;
    // 监听滚动事件（使用节流优化性能）
    window.addEventListener('scroll', function () {
      // 只有动画未执行时，才判断是否触发
      if (!_this.animationExecuted) {
        _this.checkElementInView();
      }
    });
    // 页面加载完成后先检查一次（避免元素已在可视区但未触发）
    this.checkElementInView();
  },

  // 检查元素是否进入可视区域
  checkElementInView: function () {
    const numElements = document.querySelectorAll(".numAnimation");
    if (numElements.length === 0) return;

    // 取第一个元素作为判断基准（也可遍历所有元素，只要有一个进入就触发）
    const targetElement = numElements[0];
    const rect = targetElement.getBoundingClientRect();
    // 可视区域判断条件：元素顶部进入可视区，或元素完全在可视区内
    const isInView = (
      rect.top <= window.innerHeight * 1.1 // 提前10%触发，提升体验
      && rect.bottom >= 0
    );

    // 进入可视区则执行动画
    if (isInView) {
      this.numberAnimation();
      this.animationExecuted = true; // 标记动画已执行
    }
  },
  // Num 动画逻辑
  numberAnimation: function () {
    var counts_m = [];
    const duration = 2.5;
    const options = {
      enableScrollSpy: true,
      useEasing: true,
      useGrouping: true,
      separator: ',',
      decimal: '.',
      prefix: '',
      suffix: 0
    };

    function getDecimalCount(num) {
      const lastIndex = num.lastIndexOf('.');
      if (lastIndex > 0) {
        return num.substring(lastIndex + 1, num.length).length;
      } else {
        return 0;
      }
    };

    const numElements = document.querySelectorAll(".numAnimation");
    numElements.forEach(function (element) {
      const countNum = element.getAttribute('data-num');
      if (countNum) {
        const sanitizedNum = countNum.replace(',', '');
        const decimal = getDecimalCount(sanitizedNum);
        new CountUp(element, 0, sanitizedNum, decimal, duration, options).start();
      }
    });
  },



};

IndexFn.Init();