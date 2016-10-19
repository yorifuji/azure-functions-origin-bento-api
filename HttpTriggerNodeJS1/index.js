
/*
  origin bento menu api.

  return value:
  body: {
  'result': 'ok',
  'url'   : "url for menu",
  'menu'  : 
   [
    {
      url: 'https://www.toshu.co.jp/origin/east_menu/bento/010164002418.html',
      image: 'https://www.toshu.co.jp/origin/east_menu/uploads/1610_rearosutobihudon_e.jpg',
      title: 'レア・ローストビーフ丼',
      price_n: '600円',
      price_t: '648円' 
    },
    {
      url: 'https://www.toshu.co.jp/origin/east_menu/bento/010652002416.html',
      image: 'https://www.toshu.co.jp/origin/east_menu/uploads/1610_sutaminadon_e.jpg',
      title: 'オリジンスタミナ丼',
      price_n: '490円',
      price_t: '529円' 
    },
    ...
   ]
  },
*/


var https = require('https');

var origin_menu_url = "https://www.toshu.co.jp/origin/east_menu/bento/"; // for kanto, kansai is different url.

function get_origin_menu(url) {
    return new Promise(function(resolve, reject) {
        var req = https.get(url, function(res) {
            var body = "";
            res.setEncoding("utf-8");
            res.on("data", function(chunk){
                body += chunk;
            });
            res.on("end", function(res) {
                resolve(origin_parse_html(body));
            });
        }).on("error", function(err) {
            reject(new Error(err.message));
        });
    });
}

function origin_parse_html(html) {

    var re_url     = /\s*<a href="(.+)#.+">/;
    var re_image   = /\s*<figure class="object"><img src="(.+)" alt=.+ width=.+ height=.+><\/figure>/
    var re_title   = /\s*<p class="link">(.+)<\/p>/;
    var re_price_n = /\s*<p class="price">本体価格：(.+)\/1個<\/p>/;
    var re_price_t = /\s*<p class="tax-included">\(税込:(.+)\/1個\)<\/p>/;
    
    var menu_list = [];
    var menu_obj = {
        "url"     : "",  // <a href="/origin/east_menu/bento/010248002362.html#002362">
        "image"   : "",  // <img src="/origin/east_menu/1602_tarutaruchikinnanban_e.jpg" alt="タルタルチキン南蛮弁当" width="222" height="148">
        "title"   : "",  // <p class="link">タルタルチキン南蛮弁当</p>
        "price_n" : "",  // <p class="price">本体価格：445円/1個</p>
        "price_t" : "",  // <p class="tax-included">(税込:480円/1個)</p>
    }
    
    var url_parse = require("url").parse(origin_menu_url);
    
    html = html.split("\n");
    for (var i = 0; i < html.length; i++) {
        if (html[i].match(re_url)) {
            menu_obj.url = html[i].match(re_url)[1];
        }
        else if (html[i].match(re_image)) {
            menu_obj.image = html[i].match(re_image)[1];
        }
        else if (html[i].match(re_title)) {
            menu_obj.title = html[i].match(re_title)[1];
        }
        else if (html[i].match(re_price_n)) {
            menu_obj.price_n = html[i].match(re_price_n)[1];
        }
        else if (html[i].match(re_price_t)) {
            menu_obj.price_t = html[i].match(re_price_t)[1];
            menu_obj.url   = url_parse.protocol + "//" + url_parse.host + menu_obj.url;
            menu_obj.image = url_parse.protocol + "//" + url_parse.host + menu_obj.image;
            menu_list.push(Object.assign({}, menu_obj))
        }
    }
    return menu_list;
}

module.exports = function (context, data) {
    context.log('Webhook was triggered!');
    context.log(data);

    if ("ping" in data.query) {
        context.log(data.query.ping);
        context.res = { body : {} };
        context.done();
        return;
    }

    get_origin_menu(origin_menu_url).then(function(menu_list) {
        context.log(menu_list);
        context.res = {
            body: {
                'result': 'ok',
                'url'   : origin_menu_url,
                'menu'  : menu_list
            },
        };
        context.done();
    }).catch(function(err) {
        context.log(err);
        context.res = {
            body: { 'result': err.message },
        };
        context.done();
    });
}

/* for test: node index.js */

if (require.main === module) {
    get_origin_menu(origin_menu_url).then(function(menu_list) {
        console.log(menu_list);
        console.log("total " + menu_list.length + " items");
    }).catch(function(err) {
        console.log(err);
    });
}
    
