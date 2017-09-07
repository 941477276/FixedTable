/*
* @Author: 李燕南
* @Date:   2017-08-24 19:30:04
* @Last Modified by:   李燕南941477476@qq.com
* @Last Modified time: 2017-09-01 22:19:46
*/
var gulp = require("gulp"),
	browsersync = require("browser-sync").create();
gulp.task("browser", function (){
    //启动一个静态服务器
    browsersync.init({
        server: {
        /*baseDir表示启动的静态服务器的根目录，默认以gulpfile.js所在目录一致*/
            baseDir: "./"
        },
        // 决定Browsersync启动时自动打开的网址 external 表示 可外部打开 url, 可以在同一 wifi 下不同终端测试
        open: 'external'
    });
});