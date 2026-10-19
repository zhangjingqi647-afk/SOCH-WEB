
function scrollToArea(eleId){
    let offsetTop=$(eleId).offset().top;
    console.log(offsetTop)
    $('html').animate({ scrollTop: offsetTop }, 500);
}

let timer;
let targetList=[];
for(let i=0;i<$('.anchorPositionFix').length;i++){

    targetList.push('#'+$('.anchorPositionFix').eq(i).attr('id'))
}
let activeIndex=-1;
$(window).scroll(function(){
    clearTimeout(timer)
    function scrollDone(){
        // console.log('scrollDone')
        let currentPos=$('html').scrollTop()
        activeIndex=targetList.length-1;
        for(let i=0;i<targetList.length;i++){
            let offsetTop=$(targetList[i]).offset().top;
            // console.log(currentPos,offsetTop)
            if(currentPos+1<offsetTop){
                activeIndex=i-1;
                break;
            }
        }
        // console.log(activeIndex)
        $('.side-page-nav ul li').removeClass('active')
        if(activeIndex>=0){
            $('.side-page-nav ul li').eq(activeIndex).addClass('active')
        }

    }

    timer=setTimeout(scrollDone,300)

})
