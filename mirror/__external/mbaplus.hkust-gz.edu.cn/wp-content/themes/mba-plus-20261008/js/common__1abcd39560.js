// 标识客户端
const mediaQuery = window.matchMedia("(max-width: 910px)");
function handleMediaQueryChange(mediaQuery) {
  if (mediaQuery.matches) {
    $("html").addClass("mobile");
    $(".header").addClass("hasBg");
  } else {
    $("html").removeClass("mobile");
    $("main").find('[class*="-detail"]').length > 0
      ? $("#header").addClass("detailBg")
      : $(".header").removeClass("detailBg");
  }
}
handleMediaQueryChange(mediaQuery);
mediaQuery.addEventListener("change", handleMediaQueryChange);

/**
 * 页面尺寸改变触发回调
 *
 * resizeCallback.add(fn)
 * @param {function} fn
 */
var resizeTimeout = null;
var resizeCallback = {
  function: [],
  run: function () {
    this.function.forEach((fn) => {
      fn();
    });
  },
  add: function (fn) {
    this.function.push(fn);
  },
};

function handleResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(function () {
    resizeCallback.run();
  }, 500);
}
window.addEventListener("resize", handleResize);

const CommonFn = {
  init: function () {
    this.mobileMenu();
    this.searchFn();
    this.addNavIcon();

  },

  mobileMenu: function () {
    const $menu_btn = $(".burger-menu-btn");
    $menu_btn.on("click", function () {
      $("html").toggleClass("hidden");
      $(this).toggleClass("active");
      $(".header .burger-menu").toggleClass("active");
    });
  },

  searchFn: function () {
    const $search = $(".search-wrapper");
    $search.click(function () {
      const $this = $(this);
      $this.toggleClass("active");
      $this.find("input").focus();
      $this.one("click", "form", function (e) {
        e.stopPropagation();
        $this.removeClass("active");
      });
    });
    $search.on("click", "input", function (e) {
      e.stopPropagation();
    });
  },

  addNavIcon: function () {
    const $nav = $(".mb-menu>li");
    $nav.each(function () {
      const $this = $(this);
      // 检查当前li元素是否有直接的子元素ul
      if ($this.children('ul').length > 0) {
        // 找到该li下的直接子元素a标签
        const $link = $this.children('a');
        // 检查是否已经存在箭头图标，避免重复添加
        if ($link.find('.icon-arrow-down').length === 0) {
          $link.append(' <i class="icon-arrow-down"></i>');
        }
      }
    });
  },

};

CommonFn.init();
