var ua,
    isSP = false,
    event_type = 'click';

var ww,wh;

// 日付系
var now = new Date();
var today =  getDateFormat(now, 0);
var yesterday =  getDateFormat(now, 1);

// APIから取得した動画データを格納
var movie = new Array(),
    movieW, movieH;

// APIから取得したアクティビティデータを格納
var activities = new Array();

;(function($,window,undefind) {

  var $window = $(window),
      $document = $(document),
      $navbar = $('.navbar'),
      navHeight,
      $main = $('#main'),
      $karteList = $('.js-karteList');

  function initialize(){

    getUA();
    initContent(isSP, event_type);

    function initContent(_sp, _ie, _e){
      event_type = _e;
      isSP = _sp;
      setup();
    }

    function setup() {
      wh = $window.height();
      ww = $window.width();

      movieW = ww;
      movieH = movieW * 0.75;

      navHeight = $navbar.height();

      $main.css('paddingTop', navHeight);

      // localStorage.setItem('JWT', 'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6IjEwNzAyMjcwMjI2NTI0NzUzMTEyNCIsInVzZXJfaWQiOjY0OTM0NzUxNTU0NzY0ODAsImVtYWlsIjoicGx1ZS50aWNvQGdtYWlsLmNvbSIsImV4cCI6MTUwMDYzNDQ2Nn0.Tj0Luh2DlIU47GnHDhWuFOT4AvCaVNIp3EZF2AO7SHk');

      getCatsData();

    }

    function getCatsData() {
      $.ajax({
        url: '/api/cats',
        type: 'GET',
        dataType : 'json',
        success : function(data){
          var cats = data["results"];
          for (var i = 0; i <cats.length;  i++) {
            if (i == 0) {
              $('#'+cats[i]["name"]).addClass('active');
              $('.js-cat').append('<li class=\"js-cat-item active\" data-cat=\"'+cats[i]["name"]+'\"><img src=\"'+cats[i]["image"]+'\" width=\"100%\"></li>');
            } else {
              $('.js-cat').append('<li class=\"js-cat-item\" data-cat=\"'+cats[i]["name"]+'\"><img src=\"'+cats[i]["image"]+'\" width=\"100%\"></li>');
            }
            // 名前
            $('#'+cats[i]["name"]+' .js-karte-name').html(cats[i]["name"]);
            // 歳
            var birthday = cats[i]["birthday"];
            var age = calculateAge(birthday, today);
            $('#'+cats[i]["name"]+' .js-karte-ageY').html(age["year"]);
            $('#'+cats[i]["name"]+' .js-karte-ageM').html(age["month"]);
            // 写真
            $('#'+cats[i]["name"]+' .js-karte-img img').attr("src",cats[i]["image"]);
          }

          $('.js-cat').on('click', '.js-cat-item', function() {
            var catID = $(this).attr('data-cat');
            $('.js-cat-item').removeClass('active');
            $karteList.removeClass('active');
            $('#'+catID).addClass('active');
            $(this).addClass('active');
          });

          getMoviesData(cats);
          getActivitiesData(cats);

        },
        error : function(){
          console.log("catsの取得に失敗しました");
        }
      });
    }

    function getMoviesData(cats) {
      function init() {
        $.ajax({
          url: '/api/movies',
          type: 'GET',
          dataType : 'json',
          success : function(data){
            var results = data["results"];
            for (var i = 0; i < cats.length; i++) {
              movie[i] = new Array();
              movie[i]["name"] = cats[i]["name"];
              for (var j = 0; j < results.length; j++) {
                if (cats[i]["name"] === results[j]["cat"]) {
                  if (movie[i]["movie"] == undefind) {
                    movie[i]["movie"] = results[j]["movie"];
                  }
                }
              }
              $('#'+cats[i]["name"]+' .js-movie').attr("src", movie[i]["movie"]);
            }
          },
          error : function(){
            console.log("movieの取得に失敗しました");
          }
        });
      }
      setInterval(function(){
        init();
      },60000);
      init();
    }

    function getActivitiesData(cats) {
      function init() {
        $.ajax({
          url: '/api/activities',
          type: 'GET',
          dataType : 'json',
          success : function(data){
            var results = data["results"];
console.log(results);
            for (var i = 0; i < cats.length; i++) {
              activities[i] = new Array();
              activities[i]["name"] = cats[i]["name"];
              activities[i]["weightNow"] = new Array();
              activities[i]["weightAvg"] = new Array();
              activities[i]["weightAvg"]["weight"] = 0;
              activities[i]["weightAvg"]["count"] = 0;
              for (var j = 0; j < results.length; j++) {
                if (cats[i]["name"] === results[j]["cat"]) {
                  // 昨日のデータで処理
                  if (getDateFormat(results[j]["created_at"]) == today) {
                    // 水分量の取得
                    if (activities[i]["water"] == undefind) {
                      activities[i]["water"] =+ results[j]["water"];
                    }
                  }
                  // 体温の取得
                  if (activities[i]["temperature"] == undefind) {
                    activities[i]["temperature"] = results[j]["temperature"];
                  }
                  // 体重の取得
                  if (activities[i]["weightNow"]["weight"] == undefind) {
                    activities[i]["weightNow"]["weight"] = results[j]["weight"];
                    activities[i]["weightNow"]["time"] = getTimeFormat(results[j]["created_at"]);
                  }
                  // 体重の平均値を出すために総数を取得
                  activities[i]["weightAvg"]["weight"] = activities[i]["weightAvg"]["weight"] + results[j]["weight"];
                  activities[i]["weightAvg"]["count"]++;
                }
              }
              // 体重の平均値を計算
              activities[i]["weightAvg"]["weight"] = (activities[i]["weightAvg"]["weight"] / activities[i]["weightAvg"]["count"]).toFixed(2);
              // 体温の書き換え
              $('#'+cats[i]["name"]+' .js-temperature').text(activities[i]["temperature"]);
              // いまの体重の書き換え
              $('#'+cats[i]["name"]+' .js-weight-now').text(activities[i]["weightNow"]["weight"]);
              $('#'+cats[i]["name"]+' .js-weight-nowTime').text(activities[i]["weightNow"]["time"]);
              // 体重の変動のアラート
              if ((activities[i]["weightNow"]["weight"] - activities[i]["weightAvg"]["weight"]) * 1000 > 100) {
                $('#'+cats[i]["name"]+' .js-weight-now').addClass('weight__alert');
              }
              // 体重の平均値を書き換え
              $('#'+cats[i]["name"]+' .js-weight-avg').text(activities[i]["weightAvg"]["weight"]);
              // 水分量の書き換え
              $('#'+cats[i]["name"]+' .js-water').text(activities[i]["water"]);
            }
          },
          error : function(){
            console.log("activitiesの取得に失敗しました");
          }
        });
      }
      setInterval(function(){
        init();
      },60000);
      init();
    }
  }
  initialize();

})(jQuery,window);

/*
 *
 * @param date いまの日付
 * @param num 0: 今日の日付, 1: 機能の日付
 * return YYYY-mm-ddのフォーマットで返す
 */
function getDateFormat(date, num) {
  // 第二引数がある場合
  if (num === 1) {
    date.setDate(date.getDate() -1);
  }

  var getDate = new Date(date);
  var y = getDate.getFullYear();
  var m = getDate.getMonth() + 1;
  var d = getDate.getDate();
  if (m < 10) {
    m = '0' + m;
  }
  if (d < 10) {
    d = '0' + d;
  }
  // フォーマット整形済みの文字列を戻り値にする
  return y + '-' + m + '-' + d;
}

/*
 *
 * @param date
 * return HH:mmのフォーマットで返す
 */
function getTimeFormat(date) {
  var getDate = new Date(date);
  var hour =  ("0"+(getDate.getHours())).slice(-2);
  var minute =  ("0"+(getDate.getMinutes())).slice(-2);
  // フォーマット整形済みの文字列を戻り値にする
  return hour + ':' + minute;
}

/*
 *
 * @param birthday 誕生日の年月日
 * @param today: 今日の年月日
 * return array(歳（年）, 歳（月）)
 */
function calculateAge(birthday, today) {
  var birth = birthday.split('-');
  var _birth = parseInt("" + birth[0] + birth[1] + birth[2]);
  var today = today.split('-');
  var _today = parseInt("" + today[0] + today[1] + today[2]);

  var age = new Array();
  age["year"] = parseInt((_today - _birth) / 10000);
  var month = today[1] - birth[1];
  if (month < 0) {
    month = month + 12;
  }
  if (today[2] < birth[2]) {
    month = month -1;
  }
  age["month"] = month;

  return age;
}

/* -----------------------------------------------
 * Check User Agent
 * ----------------------------------------------- */
function getUA(){

  // 変数
  var agent       = navigator.userAgent; // ユーザーエージェント
  var htmlElement = document.documentElement; // html要素

  // UserAgentで振り分けてhtmlにclassを振る
  if (navigator.platform.search("Mac") != -1) { htmlElement.className += ' mac'; }
  if(agent.search("Windows") != -1){
    htmlElement.className += ' win';
    if((agent.search("Trident") != -1) || ((agent.search("MSIE") != -1))) {
      htmlElement.className += ' ie';
      if(agent.search("Trident") != -1) { htmlElement.className += ' gte_ie8'; }
      if(agent.search("Trident") == -1) { htmlElement.className += ' lte_ie8'; }
      if(agent.search("MSIE 7") != -1){ htmlElement.className += ' ie7'; }
      if(agent.search("MSIE 8") != -1){ htmlElement.className += ' ie8'; }
      if(agent.search("MSIE 9") != -1){ htmlElement.className += ' ie9'; }
      if(agent.search("MSIE 10") != -1){ htmlElement.className += ' ie10'; }
      if(agent.search("Trident/7") != -1){ htmlElement.className += ' ie11'; }
    }
  }
  if((agent.search("Chrome") != -1) && (agent.search("OPR") == -1)){ htmlElement.className += ' chrome'; }
  if((agent.search("Safari") != -1) && (agent.search("Chrome") == -1) && (agent.search("OPR") == -1) && (agent.search("Presto") == -1)) { htmlElement.className += ' safari'; }
  if(agent.search("Firefox") != -1) { htmlElement.className += ' firefox'; }
  if(agent.search("iPad") != -1){ htmlElement.className += ' ipad'; }
  if(agent.search("iPhone") != -1){ htmlElement.className += ' iphone'; }
  if(agent.search("Android") != -1){ htmlElement.className += ' android'; }

  agent = navigator.userAgent;
  // スマホ、iPad関連はIE7,8モードで処理
  if(agent.search('iPhone') != -1){
    ua = 'iPhone';
    isSP = true;
  } else if(agent.search('iPad') != -1){
    ua = 'iPad';
    isSP = true;
  } else if(agent.search('Android') != -1){
    ua = 'Android';
    isSP = true;
  }else if(agent.search('MSIE 9') != -1){
    ua = 'IE';
    isIE = true;
  } else {
    ua = "pc";
  };
  return ua;
}