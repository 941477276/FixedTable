/*
* @Author: 李燕南
* @Date:   2017-08-22 15:56:28
* @Last Modified by:   李燕南
* @Last Modified time: 2017-08-28 10:06:25
*/
$(function (){
    $('#nav').affix({
       offset: {
          top: $('#menu_tree').offset().top,//滚动中距离页面顶端的位置
          bottom: 40
        }
    });

    $('body').scrollspy({ target: '#menu_tree' });
    
});
