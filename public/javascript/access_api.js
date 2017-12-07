window.onload = function () {
  $.LoadingOverlay("show");
  var formData = new FormData();
  var xhr = new XMLHttpRequest();
  //xhr.timeout=1000;
  var host = window.location.hostname;
  var port = window.location.port;
  var url = "http://" + host + ":" + port + "/api/user/me";
  xhr.open('GET', url);
  xhr.onreadystatechange = function () {
    switch (xhr.readyState) {
    case 0:
      // 未初期化状態.
      console.log('uninitialized!');
      break;
    case 1: // データ送信中.
      console.log('loading...');
      break;
    case 2: // 応答待ち.
      console.log('loaded.');
      break;
    case 3: // データ受信中.
      console.log('interactive... ' + xhr.responseText.length + ' bytes.');
      break;
    case 4: // データ受信完了.
      $.LoadingOverlay("hide");
      if (xhr.status == 200 || xhr.status == 304) {
        var data = xhr.responseText; // responseXML もあり
        console.log('COMPLETE! :' + data);
      } else {
        console.log('Failed. HttpStatus: ' + xhr.statusText);
      }
      break;
    }
  }
  xhr.onerror = function (e) {
    $.LoadingOverlay("hide");
    console.log(xhr);
    console.error(xhr.statusText);
  };
  xhr.onload = function (e) {
    if (this.status == 200) {
      $.LoadingOverlay("hide");
      var json = JSON.parse(this.responseText);
      //ログアウトしていたらログイン画面へ遷移
      if (json.status == "logout") {
        if (window.location.pathname != "/login") {
          location.href = '/login';
        }
      }
      //ユーザーがいない場合はアカウント作成画面
      if (json.status == "user_not_found") {
        if (window.location.pathname != "/account") {
          location.href = '/account';
        }
      }
      //ログイン後のみ、残高などを表示する
      if (window.location.pathname == "/") {
        var _walletBalanceLabel = document.getElementById('wallet_balance');
        _walletBalanceLabel.innerHTML = json.user.wallet_balance.toString();
        var _coinBalanceLabel = document.getElementById('coin_balance');
        _coinBalanceLabel.innerHTML = json.user.coin_amount.toString();
        var _gameScoreLabel = document.getElementById('game_score');
        _gameScoreLabel.innerHTML = json.user.score.toString();
        var _walletAddressLabel = document.getElementById('wallet_address');
        _walletAddressLabel.innerHTML = json.user.wallet_address.toString();
        var _walletAddressImage = document.getElementById('wallet_address_image');
        _walletAddressImage.innerHTML = '<img src="http://chart.apis.google.com/chart?chs=200x200&cht=qr&chl=' + json.user.wallet_address.toString() + '" alt="QRコード">'
      }
    }
  };
  xhr.send();
}

function goToGameLayer() {
  //console.log("login");
  if (window.location.pathname == "/") {
    var _coinBalanceLabel = document.getElementById('coin_balance');
    if (Number(_coinBalanceLabel.innerHTML) > 1) {
      location.href = '/html5/index.html';
    } else {
      alert("Coin balance is insufficient.");
    }
  }else{
    alert("Please login");
  }
}

function OnButtonClick() {
  //console.log("buy");
  $.LoadingOverlay("show");
  var xhr = new XMLHttpRequest();
  //xhr.timeout=1000;
  var host = window.location.hostname;
  var port = window.location.port;
  var url = "http://" + host + ":" + port + "/api/user/buy?amount=10";
  xhr.open('GET', url);
  xhr.onreadystatechange = function () {
    switch (xhr.readyState) {
    case 0:
      // 未初期化状態.
      console.log('uninitialized!');
      break;
    case 1: // データ送信中.
      console.log('loading...');
      break;
    case 2: // 応答待ち.
      console.log('loaded.');
      break;
    case 3: // データ受信中.
      console.log('interactive... ' + xhr.responseText.length + ' bytes.');
      break;
    case 4: // データ受信完了.
      $.LoadingOverlay("hide");
      if (xhr.status == 200 || xhr.status == 304) {
        var data = xhr.responseText; // responseXML もあり
        console.log('COMPLETE! :' + data);
        var json = JSON.parse(data);
        alert(json.status);
        if (json.status == "logout") {
          location.href = '/login';
          return;
        }
        if (json.status == "ok") {
          location.reload();
          return;
        }
        return;
      } else {
        console.log('Failed. HttpStatus: ' + xhr.statusText);
        alert("Purchase failed.");
      }
      break;
    }
  }
  xhr.onerror = function (e) {
    console.log(xhr);
    console.error(xhr.statusText);
  };
  xhr.send();
}