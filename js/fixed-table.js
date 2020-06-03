/*
* @Author: 李燕南
* @Date:   2017-08-30 11:48:13
* @Last Modified by:   李燕南
* @Last Modified time: 2017-09-07 08:59:27
*/
;(function (){


    $.fn.extend({
        fixedTable: function (columnBaseWidth){
            var $this = this;
            if(!window._fixedTableNum){
                window._fixedTableNum = 0;
            }
            return $this.each(function (index,item){
                var $this = $(this);
                window._fixedTableNum++;
                this.fixedTableNum = window._fixedTableNum;
                // 表格列默认宽度
                this.columnBaseWidth = columnBaseWidth || 80;
                this.colNames=  []; // 存储列名
                this.fixedIndex = {}; // 存储固定列的索引
                if(!$this.hasClass('fixed-table-box')){ return; }

                // if($this.hasClass('head-fixed')){return;}
                // 存储固定列的索引
                $this._setFixedIndex();
                // 计算列宽
                $._calColWidth(item);
                // 绑定resize事件
                $._bindResizeEvent(item);
                // 计算固定列的高度
                $._calFixedColHeight(item);
                // 同步滚动
                $._syncScroll(item);
                $this.rowHover();
            });
        },
        getRow: function (row){
            /*根据指定任意地方的行的索引、dom对象、jquery对象获取表格中表格主体、两侧固定列对应的行*/
            var $this = this,
                rowDom = undefined,
                index = undefined,
                rows = [];

            if(typeof row != "number"){
                rowDom = $(row);
                if(rowDom.length == 0){return;}
                index = rowDom.index();
            }else if(typeof row == "number"){
                index = row;
            }
            if(index == undefined){return this;}

            $this.each(function (index2, item){
                var $item = $(item),
                    row = {
                        bodyRow: undefined,
                        leftFixedRow: undefined,
                        rightFixedRow: undefined
                    };
                if(!$item.hasClass('fixed-table-box')){return;}
                var bodyRows = $item.children('.fixed-table_body-wraper').find("tr"),
                    leftFixed = $item.children('.fixed-table_fixed-left'),
                    rightFixed = $item.children('.fixed-table_fixed-right');

                row.bodyRow = bodyRows.eq(index);
                if(leftFixed.length > 0){
                    row.leftFixedRow = leftFixed.children('.fixed-table_body-wraper').find("tr").eq(index);
                }
                if(rightFixed.length > 0){
                    row.rightFixedRow = rightFixed.children('.fixed-table_body-wraper').find("tr").eq(index);
                }
                rows.push(row);

            });
            return rows;
        },
        deleteRow: function (row, cb){
            /*删除行，参数row可以是行的索引、dom对象、jquery对象*/
            var $this = this;
            if(row == undefined){return this;}
            return $this.each(function(index, item) {
                if(!$(item).hasClass('fixed-table-box')){return;}
                var $item = $(item),
                    rows = $item.getRow(row);
                if(!rows || rows.length == 0){return;}
                $.each(rows, function (index, row){
                    if(row.bodyRow){
                        row.bodyRow.remove();
                    }
                    if(row.leftFixedRow){
                        row.leftFixedRow.remove();
                    }
                    if(row.rightFixedRow){
                        row.rightFixedRow.remove();
                    }
                    $._calFixedColHeight(item);
                });

            });
        },
        addRow: function (htmlDom, cb){
            /*添加行，fn必须返回HTML字符串或jQuery对象*/
            var $this = this,
                returnVal = undefined,
                rowDoms = undefined;
            if(!htmlDom){return this;}
            if(({}).toString.call(htmlDom) == "[object Function]"){
                returnVal = htmlDom();
            }else{
                returnVal = htmlDom;
            }
            if(!returnVal){return this;}
            rowDoms = $(returnVal);

            if(rowDoms.length == 0){return this;}

            return $this.each(function(index, item) {
                if(!$(item).hasClass('fixed-table-box')){return;}
                var $item = $(item),
                    $fixedTableBody = $item.children('.fixed-table_body-wraper').find("tbody"),
                    $leftFixed = $item.children('.fixed-table_fixed-left'),
                    $rightFixed = $item.children('.fixed-table_fixed-right');
                $fixedTableBody.append(rowDoms);

                if(!item.fixedIndex){return;}
                //给左侧固定栏添加数据
                if(item.fixedIndex.left.length > 0 && $leftFixed.length > 0){
                    var cloneRows = rowDoms.clone(true),
                        $leftFixedBody = $leftFixed.children('.fixed-table_body-wraper').find("tbody"),
                        leftTrs = [];
                    $.each(item.fixedIndex.left, function (index2, fixedIndex){
                        cloneRows.each(function(index3, cloneRow) {
                            var leftTr = $(this).clone(true).html("");
                            $(cloneRow).find("td").each(function(index4, td) {
                                if(index4 == fixedIndex.index){
                                    leftTr.append(td);
                                }
                            });
                            leftTrs.push(leftTr);
                        });
                    });
                    $leftFixedBody.append(leftTrs);
                }
                //给右侧固定栏添加数据
                if(item.fixedIndex.right.length > 0 && $rightFixed.length > 0){
                    var cloneRows = rowDoms.clone(true),
                        $rightFixedBody = $rightFixed.children('.fixed-table_body-wraper').find("tbody"),
                        rightTrs = [];
                    $.each(item.fixedIndex.right, function (index2, fixedIndex){
                        cloneRows.each(function(index3, cloneRow) {
                            var rightTr = $(this).clone(true).html("");
                            $(cloneRow).find("td").each(function(index4, td) {
                                if(index4 == fixedIndex.index){
                                    rightTr.append(td);
                                }
                            });
                            rightTrs.push(rightTr);
                        });
                    });
                    $rightFixedBody.append(rightTrs);
                }

                //添加数据后还需要设置两侧固定列的高度
                $._calFixedColHeight(item);
                $(item).rowHover();
            });
        },
        emptyTable: function (cb){
             /*清空表格里的所有内容*/
            var $this = this;
            return $this.each(function(index, item) {
                var $item = $(item);
                if(!$item.hasClass('fixed-table-box')){return;}
                var bodyRows = $item.children('.fixed-table_body-wraper'),
                    leftFixed = $item.children('.fixed-table_fixed-left'),
                    rightFixed = $item.children('.fixed-table_fixed-right');
                bodyRows.find("tbody tr").remove();
                leftFixed.find(".fixed-table_body-wraper tbody tr").remove();
                rightFixed.find(".fixed-table_body-wraper tbody tr").remove();

                $._calFixedColHeight(item);
            });
        },
        rowHover: function (cb){
            /*鼠标hover在每一行后所处理业务*/
            var $this = this;
            return $this.each(function (index, item){
                if(!$(item).hasClass('fixed-table-box')){return;}
                var $item = $(item),
                    hoverClass = $item.attr("data-hover") || "rowHover",
                    $fixedTableBodyTrs = $item.children('.fixed-table_body-wraper').find("tr"),
                    $leftFixed = $item.children('.fixed-table_fixed-left'),
                    $rightFixed = $item.children('.fixed-table_fixed-right');
                //为 避免多次绑定，在绑定事件前先将之前绑定的事件移除掉
                $fixedTableBodyTrs.off("mouseenter.rowHover").off("mouseleave.rowHover");
                $fixedTableBodyTrs.on("mouseenter.rowHover", _process).on("mouseleave.rowHover", _process);
                if($leftFixed.length > 0){
                    var $leftFixedTrs = $leftFixed.children('.fixed-table_body-wraper').find("tr");
                    $leftFixedTrs.off("mouseenter.rowHover").off("mouseleave.rowHover");
                    $leftFixedTrs.on("mouseenter.rowHover", _process).on("mouseleave.rowHover", _process);
                }
                if($rightFixed.length > 0){
                    var $rightFixedTrs = $rightFixed.children('.fixed-table_body-wraper').find("tr");
                    $rightFixedTrs.off("mouseenter.rowHover").off("mouseleave.rowHover");
                    $rightFixedTrs.on("mouseenter.rowHover", _process).on("mouseleave.rowHover", _process);
                }
            });

            function _process(){
                var $this = $(this),
                    fixedTableBox = $this.parents(".fixed-table-box"),
                    hoverClass = fixedTableBox.attr("data-hover") || "rowHover",
                    rows = fixedTableBox.getRow($this.index());
                if(!rows || rows.length == 0){return;}

                $.each(rows, function(index, row) {
                    row.bodyRow.toggleClass(hoverClass);
                    if(row.leftFixedRow){
                        row.leftFixedRow.toggleClass(hoverClass);
                    }
                    if(row.rightFixedRow){
                        row.rightFixedRow.toggleClass(hoverClass);
                    }
                });
            }
        },
        _setFixedIndex: function (){
            /*存储固定列的下标*/
            return this.each(function (){
                var that = this,
                    $this = $(this),
                    $fixedTableHeaderTd = $this.children('.fixed-table_header-wraper').find('th');
                /*固定列的下标，数组的内容必须是一个对象，且对象格式为
                    {
                        index: 0,//下标
                        direction: "left"//固定列方向
                    }
                */
                $fixedTableHeaderTd.each(function(index, th) {
                    if(th.hasAttribute("data-fixed")){
                        var direction = ($(th).attr("data-direction") || "left").toLowerCase();
                        if(!that.fixedIndex.left){
                            that.fixedIndex.left = [];
                        }
                        if(!that.fixedIndex.right){
                            that.fixedIndex.right = [];
                        }

                        that.fixedIndex[direction].push({
                            index: index,
                            direction: direction
                        });
                    }
                });
            });
        }
    });

    $.extend({
        _calFixedColHeight: function (fixedTableBox){
            /*计算两侧固定列的高度，及右侧固定列的位置*/
            if(!$(fixedTableBox).hasClass('fixed-table-box')){return this;}
            var $fixedTableBox = $(fixedTableBox),
                $fixedTableHeader = $fixedTableBox.children('.fixed-table_header-wraper'),
                $fixedTableBody = $fixedTableBox.children(".fixed-table_body-wraper"),
                fixedTableBody = $fixedTableBody[0],
                hasHorizontalScroll = true,//用于判断固定列的高度是否要减去滚动条的宽度，这样才不会遮住水平滚动条
                hasVerticalScroll = false,//用于判断右侧的固定列的right值是否需要加上滚动条的宽度，这样才能显示出垂直滚动条
                scrollWidth = 0,
                scrollWidth2 = 0,
                maxHeight = 0,
                isIE = $._isIE();
            if(isIE){//IE浏览器
                /*在IE浏览器中$fixedTableBox.height()、$fixedTableBox[0].offsetHeight获取的高度
                都为0，不知道为什么，但$fixedTableBox[0].clientHeight和$fixedTableBox[0].scrollHeight都有值，
                为了保证两边的固定列能出来，所以就使用了这种解决方案*/
                maxHeight = $fixedTableBox.height() || $fixedTableBox[0].clientHeight || $fixedTableBox[0].scrollHeight;
            }else{
                maxHeight = $fixedTableBox.height();
            }

            if(fixedTableBody.scrollWidth > fixedTableBody.clientWidth || fixedTableBody.offsetWidth > fixedTableBody.clientWidth){
                hasHorizontalScroll = true;
            }else{
               hasHorizontalScroll = false;
            }
            console.log('fixedTableBody.scrollHeight > fixedTableBody.clientHeight', fixedTableBody.scrollHeight, fixedTableBody.offsetHeight, fixedTableBody.clientHeight)
            /*如果有水平滚动条fixedTableBody.offsetHeight会把水平滚动条的高度也计算进去，因此这里需要减去水平滚动条的高度*/
            if((fixedTableBody.scrollHeight > fixedTableBody.clientHeight) && (fixedTableBody.offsetHeight - $._getScrollWidth()) == fixedTableBody.clientHeight){
                hasVerticalScroll = true;
            }else{
               hasVerticalScroll = false;
            }
            console.log('_calFixedColHeight hasVerticalScroll', hasVerticalScroll)
            console.log('_calFixedColHeight hasHorizontalScroll', hasHorizontalScroll)

            if(hasHorizontalScroll){
                scrollWidth = $._getScrollWidth();
            }

            if(hasVerticalScroll){
                scrollWidth2 = $._getScrollWidth();

                if($fixedTableBox.find(".fixed-table-box_fixed-right-patch").length == 0){
                    var rightPatch = $('<div class="fixed-table-box_fixed-right-patch"></div>'),
                        height = $fixedTableHeader.height();
                    rightPatch.css({
                        width: scrollWidth2,
                        height: height-2
                    });
                    $fixedTableBox.append(rightPatch);
                }
            }else{
                if($fixedTableBox.find(".fixed-table-box_fixed-right-patch").length == 0){
                    $fixedTableBox.find(".fixed-table-box_fixed-right-patch").remove();
                }
            }
            var height = maxHeight - scrollWidth,
                fixedTable = $fixedTableBox.find(".fixed-table_fixed");
            if(fixedTable.height() != Math.abs(height)){
                fixedTable.height(height-1);
            }

            $fixedTableBox.find(".fixed-table_fixed.fixed-table_fixed-right").css("right", (scrollWidth) < 0 ? 1 : (scrollWidth2));
            return $fixedTableBox;
        },
        _calColWidth: function (fixedTableBox){
            /*计算表格列宽*/
            if(!$(fixedTableBox).hasClass('fixed-table-box')){return this;}
            var $this = $(fixedTableBox),
              $fixedTableHeader = $this.find(".fixed-table_header").eq(0),
              $fixedTableBody = $this.find(".fixed-table_body").eq(0),
              tableHasColGroup = $fixedTableHeader.find('colgroup').length > 0; // 判断表格是否有 colgroup 元素
            $fixedTableHeader.css('width', '');
            $fixedTableBody.css('width', '');
            var tdDefaultWith = fixedTableBox.columnBaseWidth; // 表格列默认宽度
            var fixedTableBoxWidth = $(fixedTableBox).width();
            var scrollWidth = $._getScrollWidth();
            var bodyWraperEl = $this.children('.fixed-table_body-wraper').get(0);
            console.log('bodyWraperEl', bodyWraperEl)

            var hasVerticalScroll = bodyWraperEl.scrollHeight > bodyWraperEl.clientHeight;

            var tableColGroupNames = [];
            var widths = [];
            var widthsSum = 0;
            if(tableHasColGroup){
                $fixedTableHeader.find('col').each(function () {
                    tableColGroupNames.push($(this).attr('name'));
                });
                // 移除表头、及表格中的 colgroup 元素，好让后面重新计算列宽
                $fixedTableHeader.find('colgroup').remove();
                $fixedTableBody.find('colgroup').remove();
                $this.find('.fixed-table_header').find('colgroup').remove();
                $this.find('.fixed-table_body').find('colgroup').remove();
            }
            var $ths = $fixedTableHeader.find('th');
            var $tds = $fixedTableBody.find('tr').eq(0).children();
            console.log('$tds', $tds)
            $tds.each(function (index, item) {
                var width = $ths.eq(index).attr('data-width');
                var minWidth = $ths.eq(index).attr('data-min-width');
                // width为undefined，则说明用户没有设置宽度
                var widthUndefined = typeof width === 'undefined';
                var minWidthUndefined = typeof minWidth === 'undefined';

                if(widthUndefined && minWidthUndefined){ // 使用元素本身的宽度
                    widths.push(tdDefaultWith);
                    widthsSum += tdDefaultWith;
                }else if(!widthUndefined){ // 使用传递的宽度
                    widths.push(parseFloat(width));
                    widthsSum += parseFloat(width);
                }else if(!minWidthUndefined){ // 使用传递的最小宽度
                    minWidth = parseFloat(minWidth);
                    widths.push(minWidth);
                    widthsSum += minWidth;
                }else{ // 使用元素本身的宽度
                    widths.push(tdDefaultWith);
                    widthsSum += tdDefaultWith;
                }
            });
            console.log('widths', widths, widthsSum);
            // 如果列宽的总和小于外部容器，则让列的总和等于外部容器
            if(widthsSum < (hasVerticalScroll ? (fixedTableBoxWidth - scrollWidth) : fixedTableBoxWidth)){
                // var rate = widthsSum / fixedTableBoxWidth;
                var remain = fixedTableBoxWidth - widthsSum - (hasVerticalScroll ? scrollWidth : 0);
                console.log('remain', remain, hasVerticalScroll);

                var widthsSum2 = 0;
                for(var i = 0, len = widths.length; i < len; i++){
                    var rate = widths[i] / widthsSum;
                    console.log(remain, rate, remain * rate);
                    // widths[i] = Math.floor((remain * rate)) + widths[i];
                    widths[i] = ((remain * rate) + widths[i]).toFixed(0) * 1;
                    // console.log(widths[i])
                    widthsSum2 += widths[i];
                }
                widthsSum = widthsSum2;
                if(widthsSum > fixedTableBoxWidth){

                    var max = Math.max.apply(null, widths);
                    for(var i = 0, len = widths.length; i < len; i++){
                        if(widths[i] == max){
                            widths[i] -= (widthsSum - fixedTableBoxWidth);
                            break;
                        }
                    }
                    widthsSum = fixedTableBoxWidth;
                }
                $this.find('.fixed-table_fixed').addClass('no-shadow');
            }else {
                $this.find('.fixed-table_fixed').removeClass('no-shadow');
            }


            /*var reduceW = widths.reduce(function (res, item) {
                return res += item;
            }, 0);
            if(fixedTableBoxVerticalScrollWidth === 0){
                // 在没有垂直滚动条的情况下，如果计算的列宽大于外部容器，则将最大的那个列宽减小一点
                if(reduceW > fixedTableBoxWidth){
                    var max = Math.max.apply(null, widths);
                    console.log('max', max)
                    for(var i = 0, len = widths.length; i < len; i++){
                        if(widths[i] == max){
                            widths[i] -= (reduceW - fixedTableBoxWidth);
                            break;
                        }
                    }
                }
                widthsSum = fixedTableBoxWidth;
            }*/

            console.log('scroll width', scrollWidth)
            console.log('widths', widths, widthsSum, fixedTableBoxWidth);
            var $colgroup = $('<colgroup></colgroup>');
            for(var i = 0, len = widths.length; i < len; i++){
                var $col = $('<col>');
                var name = 'fixed-table_' + fixedTableBox.fixedTableNum + '_column_' + (i + 1);
                $col.attr({
                //    name: name,
                    width: widths[i]
                });
                $colgroup.append($col);
                fixedTableBox.colNames.push(name);
            }
            console.log('$colgroup', $colgroup.html())
            var fixedIndexLeft = fixedTableBox.fixedIndex.left;
            var fixedIndexRight = fixedTableBox.fixedIndex.right;
            $fixedTableHeader.width(widthsSum).prepend($colgroup);
            $fixedTableBody.width(widthsSum).prepend($colgroup.clone());
            console.log('fixedIndex', fixedTableBox.fixedIndex)
            // 给左侧固定列设置列宽及表格宽度
            if(fixedIndexLeft && fixedIndexLeft.length > 0){
                var $colgroupLeft = $('<colgroup></colgroup>');
                var fixedLeftWidth = 0;

                for(var i = 0, len = fixedIndexLeft.length; i < len; i++){
                    var $newCol = $colgroup.children().eq(fixedIndexLeft[i].index).clone();
                    fixedLeftWidth += $newCol.attr('width') * 1;
                    $colgroupLeft.append($newCol);
                }
                console.log('fixedLeftWidth', fixedLeftWidth)
                $this.find('.fixed-table_fixed-left .fixed-table_header').width(fixedLeftWidth).prepend($colgroupLeft);
                $this.find('.fixed-table_fixed-left .fixed-table_body').width(fixedLeftWidth).prepend($colgroupLeft.clone());
            }
            // 给右侧固定列设置列宽及表格宽度
            if(fixedIndexRight && fixedIndexRight.length > 0){
                var $colgroupRight = $('<colgroup></colgroup>');
                var fixedRightWidth = 0;
                for(var i = 0, len = fixedIndexRight.length; i < len; i++){
                    var $newCol = $colgroup.children().eq(fixedIndexRight[i].index).clone();
                    fixedRightWidth += $newCol.attr('width') * 1;
                    $colgroupRight.append($newCol);
                }
                $this.find('.fixed-table_fixed-right .fixed-table_header').width(fixedRightWidth).prepend($colgroupRight);
                $this.find('.fixed-table_fixed-right .fixed-table_body').width(fixedRightWidth).prepend($colgroupRight.clone());
            }

            var hasHorizontalScroll = bodyWraperEl.scrollWidth > bodyWraperEl.clientWidth;
            var $fixedTableHeaderWraper = $this.children('.fixed-table_header-wraper');
            console.log('/ hasHorizontalScroll', hasHorizontalScroll)
            // 修复有横向滚动条留白问题
            if(hasHorizontalScroll){
                $fixedTableHeaderWraper.css('margin-right', scrollWidth + 'px');
                if($this.find('.fixed-table_header-wraper-right-patch').length === 0){
                    var $patch = $('<div class="fixed-table_header-wraper-right-patch"></div>');
                    $patch.css({
                        width: scrollWidth,
                        height: $fixedTableHeaderWraper.height()
                        // right: -scrollWidth
                    });
                    $this.append($patch);
                }
                $this.find('.fixed-table_fixed-right').css('right', scrollWidth);
            }else{
                $fixedTableHeaderWraper.css('margin-right', '');
                $this.find('.fixed-table_header-wraper-right-patch').remove();
                $this.find('.fixed-table_fixed-right').css('right', 0);
            }
            // 修复有垂直滚动条留白问题
            if(hasVerticalScroll){
                if($this.find(".fixed-table-box_fixed-right-patch").length == 0){
                    var rightPatch = $('<div class="fixed-table-box_fixed-right-patch"></div>');
                    rightPatch.css({
                        width: scrollWidth,
                        height: $fixedTableHeaderWraper.height()
                    });
                    $this.append(rightPatch);
                }
            }else{
                if($this.find(".fixed-table-box_fixed-right-patch").length == 0){
                    $this.find(".fixed-table-box_fixed-right-patch").remove();
                }
            }
            return this;
        },
        _syncScroll: function (fixedTableBox){
            /*同步滚动*/
            if(!$(fixedTableBox).hasClass('fixed-table-box')){return this;}
            var $fixedTableBox = $(fixedTableBox),
                fixedTableHeader = $fixedTableBox.children(".fixed-table_header-wraper"),
                $fixedTableBody = $fixedTableBox.children('.fixed-table_body-wraper'),
                $fixedCols = $fixedTableBox.children('.fixed-table_fixed').children('.fixed-table_body-wraper');

            $fixedTableBody.on("scroll", function (){
                var $this = $(this);

                fixedTableHeader.scrollLeft($this.scrollLeft());
                $fixedCols.scrollTop($this.scrollTop());
            });
            return this;
        },
        _bindResizeEvent: function (fixedTableBox){
          /*绑定resize事件*/
            var lasttime = 0;
            var timer = null;
            $(window).on('resize orientationchange', function () {
                var now = new Date().getTime();
                if(lasttime == 0 || now - lasttime >= 200){
                    clearTimeout(timer);
                    $._calColWidth(fixedTableBox);
                    lasttime = now;
                }else {
                    // resize事件停止后，再次执行下计算列宽以避免位置计算不正确问题
                    timer = setTimeout(function () {
                        $._calColWidth(fixedTableBox);
                        console.log('resize setTimeout')
                    }, 500);
                }
            });
        },
        _getScrollWidth: function (){
            /*获取元素或浏览器滚动条的宽度*/
            var div = document.createElement("div"),
                w1 = 0,
                w2 = 0;
            document.body.appendChild(div);

            div.style.position = "fixed";
            div.style.left = "-2000px";
            div.style.width = "200px";
            div.style.height = "200px";
            w1 = div.clientWidth;
            div.style.overflow = "scroll";
            w2 = div.clientWidth;
            document.body.removeChild(div);

            return w1-w2;
        },
        _isIE: function (){
            /*判断浏览器是否为IE浏览器*/
            var ua = navigator.userAgent.toLowerCase();
            if(/msie \d/g.test(ua) || ((/trident\/\d/g.test(ua)) && /like gecko/g.test(ua))){
                return true;
            }else{
                return false;
            }
        }
    });

})();
