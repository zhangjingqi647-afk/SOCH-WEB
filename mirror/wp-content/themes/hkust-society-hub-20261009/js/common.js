var screen_w = window.innerWidth;
var MobileWidth = 1200;
var IsMobile = false;
if (screen_w <= MobileWidth) {
  IsMobile = true;
} else {
  IsMobile = false;
}
$(window).resize(function () {
  screen_w = window.innerWidth;
  if (screen_w <= MobileWidth) {
    IsMobile = true;
  } else {
    IsMobile = false;
  }
})
var Common = {
  init: function () {
    this.bind();
    this.changeFontSize(1920, 1600, 750);
    this.drawerClick();
    // this.menuHover();
    this.searchClick();
    this.navIn();
    this.mobileMune();
  },
  bind: function () {
    setInterval(function () {
      Common.showAnimation(".transitionRight-0");
      Common.showAnimation(".transitionRight-2");
      Common.showAnimation(".transitionRight-4");
      Common.showAnimation(".transitionRight-6");
      Common.showAnimation(".transitionBottom-0");
      Common.showAnimation(".transitionBottom-2");
      Common.showAnimation(".transitionLable");
    }, 1000)

    $(window).scroll(function (e) {
      Common.showAnimation(".transitionRight-0");
      Common.showAnimation(".transitionRight-2");
      Common.showAnimation(".transitionRight-4");
      Common.showAnimation(".transitionRight-6");
      Common.showAnimation(".transitionBottom-0");
      Common.showAnimation(".transitionBottom-2");
      Common.showAnimation(".transitionLable");
    });
    // window.onload = function () {
    //   Common.showAnimation(".transitionRight-0");
    //   Common.showAnimation(".transitionRight-2");
    //   Common.showAnimation(".transitionRight-4");
    //   Common.showAnimation(".transitionRight-6");
    //   Common.showAnimation(".transitionBottom-0");
    //   Common.showAnimation(".transitionBottom-2");
    //   Common.showAnimation(".transitionLable");
    // };
  },
  // 计算rem
  changeFontSize: function (pcDesignWidth, maxWidth, appDesignWidth) {
    var doc = document,
      win = window,
      docEl = doc.documentElement,
      remStyle = document.createElement("style"),
      tid,
      designWidth,
      rem;
    function refreshRem() {
      var width = win.innerWidth;//docEl.getBoundingClientRect().width;
      if (width <= 910) {
        designWidth = appDesignWidth
      } else {
        designWidth = pcDesignWidth
      }
      width > maxWidth && (width = maxWidth);
      rem = width * 100 / designWidth;
      remStyle.innerHTML = 'html{font-size:' + rem + 'px;}';
    }
    if (docEl.firstElementChild) {
      docEl.firstElementChild.appendChild(remStyle);
    } else {
      var wrap = doc.createElement("div");
      wrap.appendChild(remStyle);
      doc.write(wrap.innerHTML);
      wrap = null;
    }
    refreshRem();
    // 当窗口尺寸发生变化时重新计算
    win.addEventListener("resize", function () {
      clearTimeout(tid)
      tid = setTimeout(refreshRem, 300)
    }, false)
    // 浏览器后退重新计算
    win.addEventListener("pageshow", function (e) {
      if (e.persisted) {
        clearTimeout(tid)
        tid = setTimeout(refreshRem, 300)
      }
    }, false)
    //body字号设置为16px
    if (doc.readyState === "complete") {
      doc.body.style.fontSize = "16px";
    } else {
      doc.addEventListener("DOMContentLoaded", function (e) {
        doc.body.style.fontSize = "16px";
      }, false);
    }
  },
  //页头菜单伸缩
  drawerClick: function () {
    $(".drawer-toggle").click(function () {
      if ($(".drawer").hasClass("close")) {
        $(".drawer").removeClass("close").addClass("open")
        $(this).find("a").css({
          'transform': 'rotate(180deg)',
          '-webkit-transform': 'rotate(180deg)'
        })
      } else {
        $(".drawer").removeClass("open").addClass("close")
        $(this).find("a").css({
          'transform': 'rotate(0)',
          '-webkit-transform': 'rotate(0)'
        })
      }
    })
  },
  //页头导航鼠标经过
  // menuHover: function () {
  //   $(".header-wrap .menu > li").hover(function () {
  //     $(".header-data-bg").addClass("active")
  //   }, function () {
  //     $(".header-data-bg").removeClass("active")
  //   })
  // },
  //页头点击搜索
  searchClick: function () {
    $(".has-search").click(function () {
      if ($(".has-search-wrapper").hasClass("active")) {
        $(".has-search-wrapper").removeClass("active")
        $("html").removeClass("hidden")
        $(this).find('span').addClass('icon-sousuo').removeClass('icon-cha')
      } else {
        $(".has-search-wrapper").addClass("active")
        $("html").addClass("hidden")
        setTimeout(function () {
          $(".has-search-wrapper .has-search-box input").focus();
        }, 500)
        $(this).find('span').addClass('icon-cha').removeClass('icon-sousuo')
      }
    })
    $(".has-search-bg").click(function () {
      $(".has-search-wrapper").removeClass("active")
      $("html").removeClass("hidden")
      $(".has-search span").addClass('icon-sousuo').removeClass('icon-cha')
    })
  },
  //导航菜单交互 + 侧边按钮
  navIn: function () {
    var desktopH = $('.header-desktop').height();
    if ($(document).scrollTop() >= desktopH) {
      $('.header-wrap').addClass("in")
      $('.header-data-bg').addClass("in")
    }
    setTimeout(function () {
      var p = 0, t = 0;
      var modTab;
      var showHeadState = true;
      $(window).scroll(function (event) {
        p = $(this).scrollTop();
        if (t <= p) {
          //向下滚
          $('.header-desktop').addClass("in")
          if (IsMobile) {
            $(".menu-search-wrapper").css("top", 0)
          }
          if ($(".drawer").hasClass("open")) {
            $(".drawer").removeClass("open").addClass("close")
            $(".drawer-toggle a").css({
              'transform': 'rotate(180deg)',
              '-webkit-transform': 'rotate(180deg)'
            })
          }
          if ($(document).scrollTop() >= desktopH) {

            $('.header-wrap').addClass("in")
            $('.header-data-bg').addClass("in")
          }
        } else {
          //向上滚
          $('.header-desktop').removeClass("in")
          if (IsMobile) {
            $(".menu-search-wrapper").css("top", "-30px")
          }
          if (showHeadState == true) {
            if ($(document).scrollTop() < desktopH && !$("#main").hasClass("page")) {
              $('.header-wrap').removeClass("in")
              $('.header-data-bg').removeClass("in")
            }
          }
        }
        setTimeout(function () { t = p; }, 0);
        // if ($(document).scrollTop() >= modTab) {
        //   $('.content-nav-bg').addClass('fixed');
        // } else {
        //   $('.content-nav-bg').css('top', '0px');
        //   $('.content-nav-bg').removeClass('fixed');
        // }
        if (p > 200) {
          $(".fixed-button").addClass('active')
        } else {
          $(".fixed-button").removeClass('active')
        }
      });
    }, 50)
    $(".fixed-button .to-top").click(function () {
      $("html,body").animate({
        scrollTop: 0
      }, 500)
    })
  },
  //动画
  showAnimation: function (demo, forceAnimating = false) {
    var scroll_H =
      document.body.scrollTop || document.documentElement.scrollTop;
    $(demo).each(function () {
      var label_offset_top = $(this).offset().top - $(window).height();

      if (label_offset_top < scroll_H) {
        $(this).addClass("active");
      } else if (label_offset_top > scroll_H) {
        $(this).removeClass("active");
      }
    });
  },
  //移动端菜单图标
  mobileMune: function () {
    if (IsMobile) {
      $(".menu-button-mobile").click(function () {
        $(".header-mobile-menu-bg").addClass("active")
        $(".menu-search-wrapper").addClass("active")
        $("html").addClass("hidden")
      })
      $(".menu-mobile-coles").click(function () {
        $(".header-mobile-menu-bg").removeClass("active")
        $(".menu-search-wrapper").removeClass("active")
        $("html").removeClass("hidden")
      })
      $(".header-mobile-menu-bg").click(function () {
        $(".header-mobile-menu-bg").removeClass("active")
        $(".menu-search-wrapper").removeClass("active")
        $("html").removeClass("hidden")
      })
    }
  },

  //校验并解析url的query，如字符串 '?a=1&b&' 会转成对象 {'a':'1','b':''}
  parseQuery: function (queryStr) {
    var reg =
      /^(\?)?(([^=&\?\s]+)(=([^=&\?\s]+)?)?)?(&([^=&\?\s]+)(=([^=&\?\s]+)?)?)*(&)?$/;
    if (reg.test(queryStr)) {
      let obj = {};
      let reg = /([^=&\?\s]+)(=([^=&\?\s]+)?)?/g;
      let result;
      while ((result = reg.exec(queryStr))) {
        // console.log(result);
        obj[result[1]] = result[3] || "";
      }
      // console.log(obj)
      return obj;
    } else {
      return null;
    }
  },

}
Common.init();