$(function () {
  var pagingInfo = $('#pageInfo')
  var data = {
    pageCount: pageNum
  }
  //表示前后都有省略号时中间页面刷新基准，为了防止点击中间时页面频繁刷新页面导致的视觉错位
  var tmpPageIndex = 0
  //添加事件
  $(document).on('click', '#pageInfo a', function () {
    let page = $(this).attr('page')
    if (page) {
      page = parseInt(page)
      refreshPageInfo(data, page)
    }
  })
  // 刷新|生成分页信息|自定义属性page表示当前页面索引
  function refreshPageInfo(data, pageIndex) {
    var pageSize = data.pageCount
    pagingInfo.html('')
    var li = $('<div class="prev"><a page="1" title="第一页" target="_self"></a></div>')
    pagingInfo.append(li)
    // 总页数小于等于1页，全部隐藏
    if (pageSize <= 1) {
      pagingInfo.hide()
    }
    // 总页数小于等于5页，全部显示
    if (pageSize <= 5) {
      for (var i = 1; i <= pageSize; i++) {
        if (i == 1) {
          var li = $(`<div class="normal"><a page="1" title="1" target="_self">1</a></div>`)
        } else {
          var li = $(`<div class="normal"><a page="${i}" title="${i}" target="_self">${i}</a></div>`)
        }
        addActive(li, i, pageIndex)
        pagingInfo.append(li)
      }
      // 当前页是前5页
    } else if (pageIndex < 5) {
      for (var i = 1; i <= 5; i++) {
        if (i == 1) {
          var li = $(`<div class="normal"><a page="${i}" title="${i}" target="_self">${i}</a></div>`)
        } else {
          var li = $(`<div class="normal"><a page="${i}" title="${i}" target="_self">${i}</a></div>`)
        }
        addActive(li, i, pageIndex)
        pagingInfo.append(li)
      }
      pagingInfo.append('<div class="normal"><a>...</a></div>')
      pagingInfo.append(
        `<div class="normal"><a page="${pageSize}" title="${pageSize}" target="_self">${pageSize}</a></div>`
      )
      // 当前页面是最后4页
    } else if (pageSize - pageIndex < 4) {
      if (pageSize - 4 > 1) {
        pagingInfo.append('<div class="normal"><a page="1" title="1" target="_self">1</a></div>')
        pagingInfo.append('<div class="normal"><a>...</a></div>')
      }
      for (var i = pageSize - 4; i <= pageSize; i++) {
        var li = $(`<div class="normal"><a page="${i}" title="${i}" target="_self">${i}</a></div>`)
        addActive(li, i, pageIndex)
        pagingInfo.append(li)
        if (i == 1) {
          pagingInfo.append('<div class="normal"><a>...</a></div>')
        }
      }
    } else {
      // 当前页面基于所有页面中间位置
      // 初始化页面基准坐标
      if (tmpPageIndex == 0) {
        tmpPageIndex = pageIndex
      }
      // 当页面索引达到最前或最后时，需要重新设置页面基准坐标
      if (tmpPageIndex <= pageIndex - 1 || tmpPageIndex >= pageIndex + 1) {
        tmpPageIndex = pageIndex
      }
      pagingInfo.append('<div class="normal"><a page="1" title="1" target="_self">1</a></div>')
      pagingInfo.append('<div class="normal"><a>...</a></div>')
      for (var i = tmpPageIndex - 1; i <= tmpPageIndex + 1; i++) {
        var li = $(`<div class="normal"><a page="${i}" title="${i}" target="_self">${i}</a></div>`)
        addActive(li, i, pageIndex)
        pagingInfo.append(li)
      }
      pagingInfo.append('<div class="normal"><a>...</a></div>')
      pagingInfo.append(
        `<div class="normal"><a page="${pageSize}" title="${pageSize}" target="_self">${pageSize}</a></div>`
      )
    }
    var li = $(`<div class="next"><a page="${data.pageCount}" title="最后一页" target="_self"></a></div>`)
    pagingInfo.append(li)
    // 总页数为0，隐藏分页标识
    if (pageSize === 0) {
      pagingInfo.html('')
    }
  }
  // 添加分页按钮焦点
  function addActive(li, i, pageIndex) {
    if (i == pageIndex) {
      li[0].className = 'current'
    }
  }
  refreshPageInfo(data, 1)
})