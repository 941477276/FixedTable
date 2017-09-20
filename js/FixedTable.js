/*
* @Author: 李燕南
* @Date:   2017-08-30 16:52:50
* @Last Modified by:   李燕南
* @Last Modified time: 2017-09-20 19:58:19
*/
;(function (factory){
    if ( typeof define === "function" && define.amd ) {
        define( ["jquery"], factory );
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory( require( "jquery" ) );
    } else {
        window.FixedTable = factory( jQuery );
        try{
            if(typeof define === "function"){
                define(function (require){
                    return factory(require("jquery"));
                });
            }
        }catch(e){}
    }
})(function ($){
    function FixedTable(options){
        this._init(options);
    }
   FixedTable._sequence = 0;

    $.extend(FixedTable.prototype, {
        _init: function (options){
            if(!options || !$.isPlainObject(options)){
                throw "缺少init所需的对象！";
            }
            this.options = {
                wrap: null,//生成的表格需要放到哪里，可以是选择器、dom对象、jQuery对象
                type: "row-col-fixed",//表格类型，有：head-fixed、col-fixed、row-col-fixed
                extraClass: "",//需要添加到表格中的额外class
                /*表格的列的每一项配置为：
                    {
                        class: "",
                        width: "150px",
                        field: "日期",//可传递字段名称。也可以传递HTML代码，如果是HTML代码则，htmlDom必须为true
                        htmlDom: false,
                        fieldId: ,//
                        fixed: false,//当前了列是否固定
                        fixedDirection: ""//如果是固定列，则该列的方向是在左边还是在右边
                    }
                */
                fields: [],//表格的列
                /*设置表格内容的最大高度，设置最大高度后可以上下滚动，它的值必须为number，如果不传递该参数则会自动计算*/
                maxHeight: undefined,
                onHover: function (){},
                hoverClass: "rowHover",//鼠标移动到每一行上时需要添加的class
                tableDefaultContent: "",//表格数据还未添加进来时显示的默认内容，可以是html字符串、dom对象、jQuery对象
                init: function (){}//FixedTable对象初始化后所执行的函数
            }
            $.extend(this.options, options);
            if(!this.options.fields || !$.isArray(this.options.fields) || this.options.fields.length == 0){
                throw "必须传递表格的列数组！";
            }
            this.wrap = $(this.options.wrap);
            this.fixedTableClass = {
                left: "fixed-table_fixed-left",
                right: "fixed-table_fixed-right"
            }
            /*固定列的下标，数组的内容必须是一个对象，且对象格式为
                {
                    index: 0,//下标
                    direction: "left"//固定列方向
                }
            */
            this.fixedIndex = {};
            if(this.options.type != "head-fixed"){
                
                var fields = this.options.fields,
                    that = this;
                $.each(fields, function (index, item){
                    if(item.fixed){
                        if(!that.fixedIndex.left){//存储左边固定栏索引
                            that.fixedIndex.left = [];
                        }
                        if(!that.fixedIndex.right){//存储右边固定栏索引
                            that.fixedIndex.right = [];
                        }
                        var direction = (!item.fixedDirection ? "left" : item.fixedDirection).toLowerCase();

                        that.fixedIndex[direction].push({
                            index: index,
                            direction: direction
                        });
                    }
                });
            }
            this.isIE = FixedTable.isIE();

            this._renderFixedTable();

            if(({}).toString.call(this.options["init"]) == "[object Function]"){
                this.options["init"].call(this);
            }
        },
        _renderFixedTable: function (){
            /*渲染fixed-table-box*/
            var that = this,
                id = "Lyn_FixedTable_" + (FixedTable._sequence ++),
                fixedTableBox = this.fixedTableBox = this.build.buildFixedTableBox(),
                fixedTableHeader = this.fixedTableHeader = this.build.buildFixedTableHeader(),
                fixedTableBody = this.fixedTableBody = this.build.buildFixedTableBody();
            this._id = id;
            //设置显示类型及需额外添加的class
            fixedTableBox.attr("id", id).addClass(this.options.type).addClass(this.options.extraClass);
            fixedTableHeader.attr("data-parentid", id);
            fixedTableBody.attr("data-parentid", id);

            //添加表格数据还未添加进来时显示的默认内容
            if(this.options.tableDefaultContent){
                this.tableDefaultContent = $(this.options.tableDefaultContent);
                fixedTableBody.append(this.tableDefaultContent);
            }
            fixedTableHeader.children(".fixed-table_header").children("thead").append(this.build.buildTableTitle(this.options.fields));
            fixedTableBox.append(fixedTableHeader).append(fixedTableBody);

            this.wrap.append(fixedTableBox);

            //计算table的宽度，否则table的宽度为auto，fixedTableBody就不会出现滚动条了
            if(this.options.type != "head-fixed"){
                var tableW = FixedTable.calTableWidth(fixedTableHeader);
                fixedTableHeader.find("table").data("data-width", tableW).width(tableW);
                fixedTableBody.find("table").data("data-width", tableW).width(tableW);
            }
            
        },
        _sequence: 0,
        build: {
            buildFixedTableBox: function (type, sequence){
                /*创建包裹table的父盒子*/
               return $('<div class="fixed-table-box"></div>');
            },
            buildFixedTableHeader: function (){
                /*创建表头*/
                var html = '';
                html += '<div class="fixed-table_header-wraper">';
                html += '    <table class="fixed-table_header" cellspacing="0" cellpadding="0" border="0">';
                html += '        <thead>';
                html += '       </thead>';
                html += '    </table>';
                html += '</div>';
                return $(html);
            },
            buildFixedTableBody: function (){
                /*创建表格的主体内容*/
                var html ='';
                html += '<div class="fixed-table_body-wraper">';
                html += '    <table class="fixed-table_body" cellspacing="0" cellpadding="0" border="0">';
                html += '        <tbody></tbody>';
                html += '    </table>';
                html += '</div>';
                return $(html);
            },
            buildFixedTable: function (){
                /*创建固定的列盒子*/
                return $('<div class="fixed-table_fixed"></div>');
            },
            buildTableTitle: function (data){
                /*创建表格标题*/
                if(!data || !$.isArray(data) || data.length == 0){return;}
                var html = ['<tr>'];
                $.each(data, function (index, item){
                    var attr = [],
                        th = '';
                    if(item["class"]){
                        attr.push('class="' + item["class"] + '"');
                    }
                    if(item.width){
                        attr.push('style="width: ' + item.width + ';"');
                    }
                    if(item.fieldId){
                        attr.push('data-fieldid="' + item.fieldId + '"');
                    }
                    if(item.fixed){
                        attr.push('data-fixed="' + item.fixed + '"');
                        if(item.fixedDirection){
                            attr.push('data-fixeddirection="' + item.fixedDirection + '"');
                        }else{
                            attr.push('data-fixeddirection=left');
                        }
                    }
                    //如果传递的field已经是html字符串则直接使用即可
                    if(item.htmlDom){
                        html.push(item.field);
                    }else{
                        html.push('<th ' + (attr.join(" ")) + '><div class="table-cell">' + item.field + '</div></th>');    
                    }
                    
                });
                html.push('</tr>');

                return $(html.join(""));
            }
        },
        getRow: function (row){
            /*根据指定任意地方的行的索引、dom对象、jquery对象获取表格中表格主体、两侧固定列对应的行*/
            var rowDom = null,
                rowIndex = undefined,
                returnVal = {
                    bodyRow: undefined,
                    leftFixedRow: undefined,
                    rightFixedRow: undefined
                };
            if(typeof row != "number"){
                rowDom = $(row);
                if(rowDom.length == 0){return;}
                rowIndex = rowDom.index();
            }else if(typeof row == "number"){
                rowIndex = row;
            }
            if(rowIndex == undefined){return this;}
            
            returnVal.index = rowIndex;
            returnVal.bodyRow = this.fixedTableBody.find("tbody tr").eq(rowIndex);
            if(this.fixedIndex.left){
                returnVal.leftFixedRow = this.fixedTableBox.find(".fixed-table_fixed-left tbody tr").eq(rowIndex);
            }
            if(this.fixedIndex.right){
                returnVal.rightFixedRow = this.fixedTableBox.find(".fixed-table_fixed-right tbody tr").eq(rowIndex);
            }
            return returnVal;
        },
        deleteRow: function (row, cb){
            /*删除行，参数row可以是行的索引、dom对象、jquery对象*/
            var rows = this.getRow(row);

            if(!rows || !rows.bodyRow){return this;}
            rows.bodyRow.remove();
            if(this.fixedIndex.left && rows.leftFixedRow){
                rows.leftFixedRow.remove();
            }
            if(this.fixedIndex.right && rows.rightFixedRow){
                rows.rightFixedRow.remove();
            }
            this._calFixedColHeight();
            if(cb && ({}).toString.call(cb) == "[obejct Function]"){
                cb.call(this);
            }
            return this;
        },
        addRow: function (htmlDom, cb){
            /*添加行，fn必须返回HTML字符串或jQuery对象*/
            var returnVal = undefined,
                rowDoms = undefined,
                that = this;
            if(!htmlDom){return this;}
            if(({}).toString.call(htmlDom) == "[object Function]"){
                returnVal = htmlDom();
            }else{
                returnVal = htmlDom;
            }
            if(!returnVal){return this;}
            rowDoms = $(returnVal);

            if(rowDoms.length == 0){return this;}
            if(this.tableDefaultContent){
                this.tableDefaultContent.remove();
            }
            this.fixedTableBody.find("tbody").append(rowDoms);
            if(this.options.type == "head-fixed"){return this;}
            if(this.fixedIndex.left || this.fixedIndex.right){
                //设置固定的列
                this._setFixedCol(rowDoms);
                //计算固定列的高度
                if (this.isIE) { 
                    //在IE浏览器中连续多次计算固定列的时候会计算出负值的情况，为了避免这个情况需加个定时器
                    setTimeout(function (){
                        that._calFixedColHeight();
                    }, 50);
                }else{
                    that._calFixedColHeight();
                }
            }

            this.rowHover(this.options.onHover);
            if(cb && ({}).toString.call(cb) == "[obejct Function]"){
                cb.call(this);
            }
            return this;
        },
        empty: function (cb){
            /*清空表格里的所有内容*/
            this.fixedTableBody.find('tbody').html("");
            if(this.fixedIndex.left || this.fixedIndex.left){
                this.fixedTableBox.find(".fixed-table_fixed").height(0).find('tbody').html("");
            }
            if(cb && ({}).toString.call(cb) == "[obejct Function]"){
                cb.call(this);
            }
            return this;
        },
        rowHover: function (cb){
            /*鼠标hover在每一行后所处理业务*/
            var that = this,
                rowHover = this.options.hoverClass,
                bodyTrs = this.fixedTableBody.find("tr");
            bodyTrs.off("mouseenter.rowHover").off("mouseleave.rowHover");
            bodyTrs.on("mouseenter.rowHover", _process).on("mouseleave.rowHover", _process);
            if(this.fixedIndex.left){
                var leftTrs = this.fixedTableBox.find(".fixed-table_fixed-left .fixed-table_body-wraper tr");
                leftTrs.off("mouseenter.rowHover").off("mouseleave.rowHover");
                leftTrs.on("mouseenter.rowHover", _process).on("mouseleave.rowHover", _process);
            }
            if(this.fixedIndex.right){
                var rihtTrs = this.fixedTableBox.find(".fixed-table_fixed-right .fixed-table_body-wraper tr");
                rihtTrs.off("mouseenter.rowHover").off("mouseleave.rowHover");
                rihtTrs.on("mouseenter.rowHover", _process).on("mouseleave.rowHover", _process);
            }

            function _process(){
                var $this = $(this),
                    rows = that.getRow($this.index());
                if(!rows.bodyRow){return;}
                rows.bodyRow.toggleClass(rowHover);
                rows.leftFixedRow.toggleClass(rowHover);
                rows.rightFixedRow.toggleClass(rowHover);

                if(cb && ({}).toString.call(cb) == "[obejct Function]"){
                    cb.call(that.fixedTableBox[0]);
                }
            }
            return this;
        },
        _syncScroll: function (){
            /*同步滚动*/
            if(!this.fixedIndex.left || !this.fixedIndex.right){return;}
            var that = this,
                fixedTableHeader = this.fixedTableHeader,
                fixedCols = this.fixedTableBox.find(".fixed-table_fixed .fixed-table_body-wraper");
            this.fixedTableBody.on("scroll", function (){
                var $this = $(this);
                fixedTableHeader.scrollLeft($this.scrollLeft());
                fixedCols.scrollTop($this.scrollTop());
            });
        },
        _calFixedColHeight: function (){
            if(!this.fixedIndex.left || !this.fixedIndex.right){return;}
            /*计算固定列的高度*/
            var maxHeight = this.options.maxHeight,
                hasCrosswiseScroll = true,//用于判断固定列的高度是否要减去滚动条的宽度，这样才不会遮住水平滚动条
                hasVerticalScroll = false,//用于判断右侧的固定列的right值是否需要加上滚动条的宽度，这样才能显示出垂直滚动条
                $fixedTableBody = this.fixedTableBody,
                fixedTableBody = $fixedTableBody[0],
                scrollWidth = 0,
                scrollWidth2 = 0,
                fixedTableBodyTable = $fixedTableBody.children('table');

            if(typeof maxHeight != "number"){
                
                if(this.isIE){//IE浏览器
                    /*在IE浏览器中this.fixedTableBox.height()、this.fixedTableBox[0].offsetHeight获取的高度
                    都为0，不知道为什么，但this.fixedTableBox[0].clientHeight和this.fixedTableBox[0].scrollHeight都有值，
                    为了保证两边的固定列能出来，所以就使用了这种解决方案*/
                    maxHeight = this.fixedTableBox.height() || this.fixedTableBox[0].clientHeight || this.fixedTableBox[0].scrollHeight;
                }else{
                    maxHeight = this.fixedTableBox.height();
                }
            }
            if(fixedTableBody.scrollWidth > fixedTableBody.clientWidth || fixedTableBody.offsetWidth > fixedTableBody.clientWidth){
                hasCrosswiseScroll = true;
            }else{
               hasCrosswiseScroll = false;
            }
            /*如果有水平滚动条fixedTableBody.offsetHeight会把水平滚动条的高度也计算进去，因此这里需要减去水平滚动条的高度*/
            if(fixedTableBody.scrollHeight > fixedTableBody.clientHeight || (fixedTableBody.offsetHeight - FixedTable.getScrollWidth()) > fixedTableBody.clientHeight){
                hasVerticalScroll = true;
            }else{
               hasVerticalScroll = false;
            }

            if(hasCrosswiseScroll){
                scrollWidth = FixedTable.getScrollWidth();
            }

            if(hasVerticalScroll){
                scrollWidth2 = FixedTable.getScrollWidth();

                if(this.fixedTableBox.find(".fixed-table-box_fixed-right-patch").length == 0){
                    var rightPatch = $('<div class="fixed-table-box_fixed-right-patch"></div>'),
                        height = this.fixedTableHeader.height();
                    rightPatch.css({
                        width: scrollWidth2,
                        height: height-2
                    });
                    this.fixedTableBox.append(rightPatch);
                }
            }else{
                if(this.fixedTableBox.find(".fixed-table-box_fixed-right-patch").length == 0){
                    this.fixedTableBox.find(".fixed-table-box_fixed-right-patch").remove();
                }
            }

            var height = maxHeight - scrollWidth,
                fixedTable = this.fixedTableBox.find(".fixed-table_fixed");
            if(fixedTable.height() != Math.abs(height)){
                fixedTable.height(maxHeight - scrollWidth);
            }

            this.fixedTableBox.find(".fixed-table_fixed.fixed-table_fixed-right").css("right", (scrollWidth2-1) < 0 ? 1 : (scrollWidth2 - 1));
        },
        _setFixedCol: function (rowDoms){
            /*设置需要固定的列*/
            var that = this,
                fixedIndex = this.fixedIndex,
                first = true,//用来判断是否生成tr
                leftFixedTableWrap = undefined,//左边固定栏
                leftFixedTableHeader = undefined,
                leftFixedTableBody = undefined,
                rightFixedTableWrap = undefined,//右边固定栏
                rightFixedTableHeader = undefined,
                rightFixedTableBody = undefined;

            if(fixedIndex.left || fixedIndex.right){//有固定列
                if(fixedIndex.left && !this.fixedColCreated){//有左边固定列，并且是第一次添加数据
                    leftFixedTableWrap = that.build.buildFixedTable().addClass(this.fixedTableClass["left"]);
                    leftFixedTableHeader = that.build.buildFixedTableHeader();
                    leftFixedTableBody = that.build.buildFixedTableBody();
                }else if(fixedIndex.left && this.fixedColCreated){//有左边固定列，并且不是第一次添加数据
                    leftFixedTableWrap = that.fixedTableBox.find(".fixed-table_fixed-left");
                    leftFixedTableHeader = leftFixedTableWrap.find(".fixed-table_header-wraper");
                    leftFixedTableBody = leftFixedTableWrap.find(".fixed-table_body-wraper");
                }
                if(fixedIndex.right && !this.fixedColCreated){//有右边固定列
                    rightFixedTableWrap = that.build.buildFixedTable().addClass(this.fixedTableClass["right"]);//右边固定栏
                    rightFixedTableHeader = that.build.buildFixedTableHeader();
                    rightFixedTableBody = that.build.buildFixedTableBody();
                }else if(fixedIndex.right && this.fixedColCreated){
                    rightFixedTableWrap = that.fixedTableBox.find(".fixed-table_fixed-right");
                    rightFixedTableHeader = rightFixedTableWrap.find(".fixed-table_header-wraper");
                    rightFixedTableBody = rightFixedTableWrap.find(".fixed-table_body-wraper");
                }
            }else{//无固定列
                leftFixedTableWrap = that.fixedTableBox.find(".fixed-table_fixed-left");
                leftFixedTableHeader = leftFixedTableWrap.find(".fixed-table_header-wraper");
                leftFixedTableBody = leftFixedTableWrap.find(".fixed-table_body-wraper");

                rightFixedTableWrap = that.fixedTableBox.find(".fixed-table_fixed-right");
                rightFixedTableHeader = rightFixedTableWrap.find(".fixed-table_header-wraper");
                rightFixedTableBody = rightFixedTableWrap.find(".fixed-table_body-wraper");
            }
            
            //计算固定列的表头，表头只计算一遍
            if(!this.titleFixeded){
                var outerFixedTableCols = this.fixedTableHeader.find('.fixed-table_header th'),
                    leftCloneThead = [],
                    rightCloneThead = [],
                    leftCount = 0,
                    rightCount = 0,
                    leftTr = $("<tr></tr>"),
                    rightTr = $("<tr></tr>");

                outerFixedTableCols.each(function(index, ele) {
                    if(fixedIndex.left){
                        $.each(fixedIndex.left, function(index2, item) {
                            if(index == item.index){
                                leftCloneThead.push($(ele).clone(true));
                                if(leftCount != 0){
                                    //移动原来的表头列到对应位置
                                    if(index2 != 0){
                                        var ths = that.fixedTableHeader.find('.fixed-table_header th')
                                        //每次替换位置后需重新获取一下，否则位置会出错
                                        ths.eq(item.index).insertAfter(ths.eq(index2-1));
                                    }
                                    
                                }
                                leftCount++;
                            }
                        });
                    }
                    if(fixedIndex.right){
                        $.each(fixedIndex.right, function(index2, item) {
                            if(index == item.index){
                                rightCloneThead.push($(ele).clone(true));

                                var ths = that.fixedTableHeader.find('.fixed-table_header th');
                                if(index2 != ths.length - 1){
                                    /*每次替换位置后需重新获取一下，否则位置会出错*/
                                    outerFixedTableCols.eq(item.index).insertAfter(that.fixedTableHeader.find('.fixed-table_header th').eq(outerFixedTableCols.length - 1));
                                    rightCount++;
                                }
                            }
                        });
                    }
                });


                leftFixedTableHeader && leftFixedTableHeader.find(".fixed-table_header thead").append(leftTr.append(leftCloneThead));
                rightFixedTableHeader && rightFixedTableHeader.find(".fixed-table_header thead").append(rightTr.append(rightCloneThead));

                this.titleFixeded = true;
            }


            var leftCloneBody = [],
                rightCloneBody = [],
                rowDomsClone = rowDoms.clone(true),
                leftCount = 0,
                rightCount = 0;

            //计算固定列的内容
            rowDomsClone.each(function(index, ele) {
                var $this = $(this),
                    leftTr = $(ele).clone(true).html(""),
                    rightTr = $(ele).clone(true).html("");
                $this.children('td').each(function (index2, td){
                    if(fixedIndex.left){
                        $.each(fixedIndex.left, function (index3, item){
                            if(index2 == item.index){
                                leftTr.append($(td).clone(true));
                                leftCloneBody.push(leftTr);
                                leftCount++;
                            }
                        });
                    }
                    if(fixedIndex.right){
                        $.each(fixedIndex.right, function(index3, item) {
                            if(index2 == item.index){
                                rightTr.append($(td).clone(true));
                                rightCloneBody.push(rightTr);   
                            } 
                        });
                    }
                });
            });
            //移动表格数据中的列，以让其与固定列对应
            rowDoms.each(function(index, el) {
                var $this = $(this),
                    curTd = $this.children('td');
                curTd.each(function(index2, td) {
                    var $td = $(td);
                    if(fixedIndex.left){
                        $.each(fixedIndex.left, function (index3, item){
                            if(index2 == item.index){
                                if(index3 != 0){
                                    $td.insertAfter($this.children('td').eq(index3 -1));    
                                }
                            }
                        });
                    }
                    if(fixedIndex.right){
                        $.each(fixedIndex.right, function(index3, item) {
                            if(index2 == item.index){
                                if(index3 != curTd.length - 1){
                                    $td.insertAfter($this.children('td').eq(curTd.length - 1));
                                }  
                            } 
                        });
                    }
                });
            });

            if(leftFixedTableWrap){
                leftFixedTableBody.find("tbody").append(leftCloneBody);
                if(!this.fixedColCreated){
                    leftFixedTableWrap.append(leftFixedTableHeader).append(leftFixedTableBody);
                    this.fixedTableBox.append(leftFixedTableWrap);
                }
            }
            if(rightFixedTableWrap){
                rightFixedTableBody.find("tbody").append(rightCloneBody);
                if(!this.fixedColCreated){
                    rightFixedTableWrap.append(rightFixedTableHeader).append(rightFixedTableBody);
                    this.fixedTableBox.append(rightFixedTableWrap);
                }
            }    
            if(!this.fixedColCreated){
                this._syncScroll();
            }
            this.fixedColCreated = true;        
        }
    });

    /*获取元素滚动条的宽度*/
    FixedTable.getScrollWidth = function (){
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
    }
    /*计算表格的真实宽度*/
    FixedTable.calTableWidth = function (fixedTableHeader){
        var cloneTable = $(fixedTableHeader).clone(true),
            width = 0;
        cloneTable.css({
            position: "fixed",
            left: "-2000px",
            width: "auto"
        });
        $("body").append(cloneTable);
        width = cloneTable.width();
        cloneTable.remove();
        return width;
    }
    /*判断浏览器是否为IE浏览器*/
    FixedTable.isIE = function (){
        var ua = navigator.userAgent.toLowerCase();
        if(/msie \d/g.test(ua) || ((/trident\/\d/g.test(ua)) && /like gecko/g.test(ua))){
            return true;
        }else{
            return false;
        }
    }

    return FixedTable;
});
