var salt = Math.floor((1 + Math.random()) * 0x100000).toString(36);
/**
 * @yugasun
 * 心跳打点程序
 * 参数说明：
 * i    5                                       心跳间隔，当前默认为5s；
 * et   play/seeking/pause/videoend/heartbeat   操作行为事件类型；
 * p    web/android                             终端类型；
 * cp   512.5                                   发生操作行为的视频位置；
 * fp   50.0                                    拖拽行为的起始点；（只有当发生拖拽事件时产生et=drag）
 * tp   20.5                                    拖拽行为的终止点；（只有当发生拖拽事件时产生et=drag）
 * sp   1.0                                     当前播放倍速；
 * ts   1480407618                              当前用户的系统时间；
 * u    50275                                   用户id；
 * c    course-v1:a+b+c                         课程id；
 * v    abcd                                    视频id；（课程结构中的）
 * cc   abcd0741                                在cc上的视频存储id；
 * d    150.0                                   视频时长；
 * pg   abcdefg                                 页面编号；
 * sq   2                                       操作行为的顺序编号；
 *
 * */
var heartBeat = {
    api: 'http://log.xuetangx.com/heartbeat?',   // 心跳请求api
    seq: 0, // 心跳程序 请求api次数
    initialed: false,   // 是否初始化心跳程序
    $videoEle: null,    // video jqury 对象
    videoEle: null, // video DOM 对象
    get_params_rate: 2, // 获取心跳参数timer间隔，单位s
    heart_beat_rate: 5, // 提交心跳参数timer间隔，单位s
    get_params_timer: null, // 获取心跳参数timer
    send_params_timer: null,    // 提交心跳参数timer
    // 心跳参数
    params: {
        i: 5,
        et: '',
        p: 'web',
        cp: 0,
        fp: 0,
        tp: 0,
        sp: 1.0,
        ts: 0,
        u: '',
        c: '',
        v: '442314abe435488fb8d7f147b014795a',
        cc: 0,
        d: 0,
        pg: "442314abe435488fb8d7f147b014795a_" + salt,
        sq: 0
    },
    // 初始化
    init: function ($ele) {
        if (this.initialed) {
            return;
        }
        this.initialed = true;

        this.$videoEle = $ele.find('video').eq(0);
        this.videoEle = this.$videoEle[0];
        this.params.cc = $ele.data('ccsource');
        var arr = location.pathname.match(/^\/courses\/(.*)\/courseware.*/);
        this.params.c = arr ? arr[1] : '';
        this.params.u = this.getUserId();
        this.bindEvent();

        console.log('Heartbeat init');
    },
    // 重置timer
    resetTimer: function () {
        var $this = this;
        $this.clearTimer();
//            $this.get_params_timer = setInterval($this.getParams.bind($this), $this.get_params_rate * 1000);
        $this.send_params_timer = setInterval($this.sendHeartParams.bind($this), $this.heart_beat_rate * 1000);
    },
    // 清除timer
    clearTimer: function () {
        var $this = this;
//            $this.get_params_timer && clearInterval($this.get_params_timer);
        $this.send_params_timer && clearInterval($this.send_params_timer);
    },
    /**
     * bind 视屏相关事件
     */
    bindEvent: function () {
        var $this = this;
        // 视频可以播放事件监听， duration参数只有在canplay事件触发后才能获取。
        $this.$videoEle.on('canplay', function () {
            $this.params.d = Math.round($this.videoEle.duration * 10) / 10;
        });
        // 播放事件监听
        $this.$videoEle.on('play', function () {
            // 重置timmer
            $this.resetTimer();
            $this.params.et = 'play';
            $this.getParams();
            $this.sendEvents();
        });
        // 暂停事件监听
        $this.$videoEle.on('pause', function () {
            $this.clearTimer();
            $this.params.et = 'pause';
            $this.getParams();
            $this.sendEvents();
        });
        // 跳播事件监听
        $this.$videoEle.on('xt.progress.seek', function (e, data) {
            e.stopPropagation();
            $this.params.fp = data.old_time;
            $this.params.cp = $this.params.tp = data.new_time;
            $this.params.et = 'seeking';
            $this.sendEvents();
        });

        // 视频结束事件监听
        $this.$videoEle.on('ended', function () {
            $this.clearTimer();
            $this.params.et = 'videoend';
            $this.getParams();
            $this.sendEvents();
        });
        // 视频播放速度监听
        $this.$videoEle.on('ratechange', function () {
            $this.params.sp = $this.videoEle.playbackRate;
        });
    },
    // 获得传递参数
    getParams: function () {
        this.params.cp = this.videoEle.currentTime;
    },
    // 请求接口
    sendEvents: function () {
        var $this = this;
        $this.params.sq++;
        $this.params.cp = Math.round($this.params.cp * 10) / 10;
        $this.params.fp = Math.round($this.params.fp * 10) / 10;
        $this.params.tp = Math.round($this.params.tp * 10) / 10;
        $this.params.ts = Date.now ? Date.now() : new Date().getTime();
        var url = $this.api + $this.buildUrl($this.params);
        $.ajax({
            type: 'GET',
            url: url,
            timeout: 3000,
            callback:'c',
            jsonpCallback: 'c',
            dataType: 'jsonp'
        });
    },
    // 获得用户id cookie
    getUserId: function() {
        var user_id, _log_user_id;
        var arr = document.cookie.split(";");
        for (var i = 0; i < arr.length; i++) {
            var temp = arr[i].split("=");
            temp[0] = temp[0].replace(/(\s)?/g, '')
            if (temp[0] == 'user_id') {
                user_id = temp[1];
            }
            if (temp[0] == '_log_user_id') {
                _log_user_id = temp[1];
            }
        }
        return user_id || ("!" + _log_user_id) || ("!" + 'undefined');
    },
    // 生成参数
    buildUrl: function (obj) {
        var arr = [];
        for( var i in obj ){
            arr.push(i + '=' + encodeURIComponent(obj[i]));
        }
        return arr.join('&');
    },
    // 发送心跳参数
    sendHeartParams: function () {
        this.params.et = 'heartbeat';
        this.getParams();
        this.sendEvents();
    }
};

videoDiv.on("initialize", null, function () {
    initializeCDNExperiment();
    /**
     * @yugasun
     * 初始化心跳程序
     */
    heartBeat.init(videoDiv);
});
