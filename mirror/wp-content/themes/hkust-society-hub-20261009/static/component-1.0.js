var Component = {
  init: function () {
    this.goThis; //点击滑动定位
    this.showAnimation; //向下滚动触发动画
    this.isMobile; //判断当前宽度是否小于minWidth
    this.fontColor;//文字颜色闪烁
    this.fontColorNO;//文字特效还原
    this.NumAutoPlusAnimation;//数字跳动
    this.getUrlParam;//获取url中的参数
  },
  /**
   * 点击滑动定位
   * @param obj       点击对象
   * @param gothis    滚动对象
   * @param speed     滚动速度
   * @param queue    是否队列触发
   * @param distance 数字，位移距离微调整
   * 队列触发则 gothis命名为 .name + queueIndex
   * demo :  Component.goThis('.nav li','.box_',1000,true,'50');
  */
  goThis: function (obj, gothis, speed, queue, distance) {
    var queueIndex = '';
    distance = distance || 0;
    $(obj).bind('click', function (e) {
      e.stopPropagation();
      if (queue == true) {
        queueIndex = $(this).index() + 1;
        var apex = $(gothis + queueIndex).offset().top - distance;
      } else {
        var apex = $(gothis).offset().top - distance;
      }
      $("html,body").animate({ scrollTop: apex }, speed);
    })
  },
  /*****************************/

  /**
   * 向下滚动触发动画
   * @param InitClass   动画绑定、初始状态类名
   * @param actClass    动画激活状态的类名
   * demo :  Component.showAnimation('.transitionLable','active');
   * 
  */
  showAnimation: function (InitClass, actClass) {
    function q() {
      var scroll_H =
        document.body.scrollTop || document.documentElement.scrollTop;
      $(InitClass).each(function () {
        var label_offset_top = $(this).offset().top - $(window).height();
        if (label_offset_top < scroll_H) {
          $(this).addClass(actClass);
        } else if (label_offset_top > scroll_H) {
          $(this).removeClass(actClass);
        }
      });
    }
    q();
    $(window).scroll(function () {
      q();
    });
  },
  /*****************************/

  /**
   * 判断当前宽度是否小于minWidth
   * @param minWidth   判定宽度
   * demo :  Component.showAnimation('.transitionLable','active');
   * 
  */
  isMobile: function (minWidth) {
    var screen_w = window.innerWidth;
    if (screen_w <= minWidth) {
      return true;
    } else {
      return false;
    }
  },
  /*
  * @param dome     文字dom
  * @param lnitial  初始颜色，默认为蓝色#3455fc
  */
  fontColor: function (dome, lnitial = '#3455fc') {
    var K, t, y, B, span = '', d = [], br = 0, brIn = true, color = '';
    t = $(dome)
    color = t.css("color")
    K = t.html().replace(/&amp;/g, "&");
    y = K.replace(/<\/?[^>]+>/igm, "");
    y = y.replace(/^\s+|\s+$/g, "");
    q = y.length;
    for (z = 0; z < q; z++) {
      B = y.charAt(z)
      " " === B && (B = "&nbsp;")
      span = $("<span>" + B + "</span>")
      span.css({
        'color': lnitial,
        'transition': 'color 0.3s ease',
        '-webkit-transition': 'color 0.3s ease'
      })
      d.push(span);
    }
    d.map(data => {
      num = Math.random() * 1000
      setInterval(() => {
        data.css({ color: color })
      }, num)
    })
    //是否换行
    // function hasBr(index){
    // 	if(brIn){
    // 		d.splice(index,0,$('<br>'))
    // 		index = K.indexOf('<br>',index)
    // 		K.indexOf('<br>',index) > -1 ? brIn=true : brIn=false
    // 		hasBr(index)
    // 	}
    // }
    // hasBr(br)
    if (K.indexOf('<br>') > -1) {
      d.splice(K.indexOf('<br>'), 0, $('<br>'))
    }
    t.html(d)
  },
  //文字特效还原
  fontColorNO: function (dome) {
    let t = $(dome), arrHTML = '', i;
    i = t.find('br').index()
    arrHTML += t.text().substring(0, i)
    arrHTML += '<br>'
    arrHTML += t.text().substring(i)
    arrHTML = arrHTML.replace(/ /g, ' ')
    t.html(arrHTML)
    // let t = $(dome), arrHTML = [], text = '', i;
    // i = t.find('br').index()
    // text = $(dome).text().replace(/ /g, ' ')
    // arrHTML.push(text.substring(0, i))
    // arrHTML.push($('<br>'))
    // arrHTML.push(text.substring(i))
    // t.html(arrHTML)
  },
  //数字递增动画 targetEle:数字box，options:配置速度和时间
  NumAutoPlusAnimation: function (targetEle, options) {
    var scroll_H = document.body.scrollTop || document.documentElement.scrollTop;
    var label_offset_top;
    $(targetEle).each(function () {
      label_offset_top = $(this).offset().top - $(window).height();
      if (label_offset_top < scroll_H && active) {
        options = options || {};
        var time = options.time || 2000, //总时间--毫秒为单位
          regulator = options.regulator || 100, //调速器，改变regulator的数值可以调节数字改变的速度
          count = 0, //计数器
          initial = 0,
          finalNum, //要显示的真实数值;
          timer,
          step,
          _that = $(this);
        finalNum = parseInt(Number(_that.text()))
        step = finalNum / (time / regulator)
        timer = setInterval(function () {
          count = count + step;

          if (count >= finalNum) {
            clearInterval(timer);
            count = finalNum;
          }
          var t = Math.floor(count);
          if (t == initial) {
            active = false
            return
          };
          initial = t;
          _that.text(initial)
        }, 30);
      }
    })
  },
  /*获取URL中的参数
  *para key 参数名
  */
  getUrlParam: function (key) {
    var url = location.search;
    var theRequest = new Object();
    if (url.indexOf("?") != -1) {
      var str = url.slice(1);
      strs = str.split("&");
      for (var i = 0; i < strs.length; i++) {
        theRequest[strs[i].split("=")[0]] = decodeURIComponent(strs[i].split("=")[1]);
      }
    } else {
      return undefined
    }
    var value = theRequest[key];
    return value;
  }
}
Component.init();