// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  const backToTopBtn = document.getElementById('back-to-top');
  
  // 监听页面滚动事件
  window.addEventListener('scroll', function() {
    // 当滚动距离超过100px时显示按钮，否则隐藏
    if (window.scrollY > 100) {
      backToTopBtn.style.display = 'block';
    } else {
      backToTopBtn.style.display = 'none';
    }
  });
  
  // 点击按钮回顶部
  backToTopBtn.addEventListener('click', function() {
    // 平滑滚动到顶部，behavior: 'smooth' 实现平滑效果
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
});