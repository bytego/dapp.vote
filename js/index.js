var HttpRequest = require("nebulas").HttpRequest;
var Neb = require("nebulas").Neb;
var Account = require("nebulas").Account;
var Transaction = require("nebulas").Transaction;
var Unit = require("nebulas").Unit;
var myneb = new Neb();
myneb.setRequest(new HttpRequest("https://mainnet.nebulas.io"));
var account, tx, txhash;

//to check if the extension is installed
//if the extension is installed, var "webExtensionWallet" will be injected in to web page
if (typeof (webExtensionWallet) === "undefined") {

} else {
    $("#wallet_alert").hide();
}

var dappAddress = "n1she7qBfFTTGr1H3Dgr6JLuXs2QGoC2QxZ";
// dappAddress = "n1sgsPCNuR9sw2Nekr8qFNRtQG2ySj5fLfD";

var value = "0";
var allCount = 0;

initPageData();

$("#btn_refresh").click(function () {
    initPageData();
});

function refreshData() {
    myneb.api.call({
        from: dappAddress,
        to: dappAddress,
        value: 0,
        contract: {
            function: "forEach",
            args: JSON.stringify([0, allCount])
        },
        gasPrice: 1000000,
        gasLimit: 2000000,
    }).then(function(tx) {
        arrs = JSON.parse(tx.result);
        console.log(arrs);
        refreshPage(tx);
    });


    myneb.api.call({
        from: dappAddress,
        to: dappAddress,
        value: 0,
        contract: {
            function: "getAllUser",
            args: ""
        },
        gasPrice: 1000000,
        gasLimit: 2000000,
    }).then(function(tx) {
        arr = JSON.parse(tx.result);

        var compare = function (obj1, obj2) {
            var val1 = obj1.value;
            var val2 = obj2.value;
            if (val1 < val2) {
                return 1;
            } else if (val1 > val2) {
                return -1;
            } else {
                return 0;
            }
        }

        console.log (arr.sort(compare));

        var html = "";

        arr.forEach(function (value,index) {

            index++

            html += "<tr><td>" + index  + "</td><td>" + value.key + "</td><td>" + value.value + "人</td></tr>";


        })

        $("#info_table_record").html(html);

    });

}

function initPageData() {
    myneb.api.call({
        from: dappAddress,
        to: dappAddress,
        value: 0,
        contract: {
            function: "len",
        },
        gasPrice: 1000000,
        gasLimit: 2000000,
    }).then(function(resp) {
            var result = resp.result;
            allCount = parseInt(result);
            console.log("allcount=" + allCount);
            refreshData();
    });
}

var mapMarkers = [];

function refreshPage(resp) {
    var result = resp.result;
    console.log("return of rpc call: " + JSON.stringify(result))

    if (result === 'null') {
        $("#noinfo_alert").show();
    } else {
        //if result is not null, then it should be "return value" or "error message"
        try {
            result = JSON.parse(result)
        } catch (err) {
            //result is the error message
        }
        console.log("result " + result);

        $("#info_table").html("");

        var arrar = result.split("|");
        var len = arrar.length;

        for (var i = 0; i < arrar.length - 1; i++) {

            var result1 = arrar[i];
            var obj = JSON.parse(result1);


            var author = obj.author;
            var nickname = obj.nickname;
            var timestamp = obj.timestamp;
            var longitude = obj.longitude;
            var latitude = obj.latitude;
            var message = obj.message;
            var contact = obj.contact;

            if (obj.nickname === "") {
                nickname = author;
            };

            if (obj.contact === "") {
                contact = "无";
            };

            var html = "<tr><td>" + nickname + "</td><td>" + message + "</td><td>" + contact + "</td></tr>";

            $("#info_table").append(html);
            mapMarkers.push({ name:  "我是："+ message + "，为家乡：" + nickname + "，送祝福：" + contact, latLng: [latitude, longitude] });
        };

        mapObj.addMarkers(mapMarkers, []);

    }

}


$("#btn_submit").click(function () {
    var message = $("#exampleInputContent").html();

    if (message === "") {

        alert("请选择你的家乡");
        return;
    }

    getLocation();
});

function cbPush(resp) {
    var result = resp.result;
    console.log("response of push: " + result);
}

function getLocation() {
    $("#load_alert").show();

    var geolocation = new BMap.Geolocation();
    geolocation.getCurrentPosition(function (r) {
        if (this.getStatus() == BMAP_STATUS_SUCCESS) {
            onSuccess(r.point.lat, r.point.lng);
            $("#load_alert").hide();
        }
        else {
            alert('failed' + this.getStatus());
        }
    });
}
function error() {
    alert("sorry , your brower is not  used   for this position!  ");
}
function onError(position) {
    console.log(position);//打印错误信息
    var innerHTML = "获取位置错误";
    switch (error.code) {
        case error.PERMISSION_DENIED:
            innerHTML = "用户拒绝对获取地理位置的请求。需要科学上网获取位置"
            break;
        case error.POSITION_UNAVAILABLE:
            innerHTML = "位置信息是不可用的。需要科学上网获取位置"
            break;
        case error.TIMEOUT:
            innerHTML = "请求用户地理位置超时。需要科学上网获取位置"
            break;
        case error.UNKNOWN_ERROR:
            innerHTML = "未知错误。需要科学上网获取位置"
            break;
    }
    alert(innerHTML);
}

function onSuccess(lat, lag) {

    var home = $("#exampleInputContent").html();
    var nickname = $("#exampleInputContact").val();
    var word = $("#exampleInputNickname").val();
    var timestamp = new Date().getTime();

    var to = dappAddress;
    var value = "0";
    var callFunction = "save";
    var callArgs = "[\"" + home + "\",\"" + lag + "\",\"" + lat + "\",\"" + nickname + "\",\"" + word + "\"]";

    window.postMessage({
            "target": "contentscript",
            "data": {
                "to": to,
                "value": "0",
                "contract": {
                    "function": "save",
                    "args": JSON.stringify([home,lag,lat,nickname,word])
                }
            },
            "method": "neb_sendTransaction"
        }, "*");
}

//地图插

var mapObj = new jvm.Map({
    container: $('#world-map'),
    map: 'cn_mill',
    normalizeFunction: 'polynomial',
    scaleColors: ['#C8EEFF', '#0071A4'],
    hoverOpacity: 0.7,
    hoverColor: false,
    markerStyle: {
        initial: {
            fill: '#F8E23B',
            stroke: '#383f47'
        }
    },
    backgroundColor: '#383f47',
    markers: [

    ],
    onRegionClick : function (e, code) {

        var home = mapObj.getRegionName(code);
        $("#exampleInputContent").html(home);
    }
});

