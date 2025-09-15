// 修复上下文菜单的临时脚本
(function() {
    // 确保 Utils.hideContextMenu 方法存在
    if (window.Utils && !Utils.hideContextMenu) {
        Utils.hideContextMenu = function() {
            const existingMenu = document.querySelector('.context-menu');
            if (existingMenu) {
                existingMenu.remove();
            }
        };
        console.log('已添加 Utils.hideContextMenu 方法');
    }
    
    // 修复现有的上下文菜单点击事件
    document.addEventListener('click', function(e) {
        if (e.target.closest('.context-menu-item')) {
            setTimeout(() => {
                const menu = document.querySelector('.context-menu');
                if (menu) menu.remove();
            }, 100);
        }
    });
    
    console.log('上下文菜单修复脚本已加载');
})();