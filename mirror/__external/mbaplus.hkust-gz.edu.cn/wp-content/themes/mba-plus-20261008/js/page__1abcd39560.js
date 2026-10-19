const pageFn = {
    faqFn: function () {
        const items = $(".faq > div");

        items.first().addClass("active");

        items.on("click", function () {
            const $this = $(this);

            // 如果当前项已激活，直接切换（收起）
            if ($this.hasClass("active")) {
                $this.toggleClass("active");
            } else {
                // 如果当前项未激活，先移除所有active，再给当前项添加active
                items.removeClass("active");
                $this.addClass("active");
            }
        });
    },
}

pageFn.faqFn()