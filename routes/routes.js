var app = module.parent.exports;
var passport = app.get("passport");
var crypto = require("crypto");
var UserModel = require('../models/userModel.js');
var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream('debug.log', {flags : 'w'});
var log_stdout = process.stdout;

console.log = function(d) {
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

//curl 'http://localhost:3000/api/user/test' -XGET
app.get('/api/user/test', function (req, res) {
    if(req.session.passport.user) {
        console.log(req.session.passport.user.id);
    }else{
        console.log("failed get session");
        res.json({
            status:"logout",
            message:"failed get session"
        });
        return;
    }
    console.log("ok");
    res.json({
        status:"ok",
        message:"This is user api"
    });
});

//curl 'http://localhost:3000/api/me' -XGET
app.get('/api/user/me', function (req, res){
    if(req.session.passport.user) {
        console.log(req.session.passport.user.id);
    }else{
        console.log("error");
        res.json({
            status:"logout",
            message:"failed get session"
        });
        return;
    }

    var User = null;
    UserModel
        .find({twitter_user_id:req.session.passport.user.id})
        .then(function (user) {
            if(user.length == 0){
                res.json({ 
                    status:"user_not_found",
                    message: 'user not found' 
                });
            }
            var _balance = loadBalance(user[0].wallet_address,user,res);
        }
    );
});

//curl 'http://localhost:3000/api/user/reset' -XGET
app.get('/api/user/resetwallet',function(req,res){
    console.log("create");
    //console.log(req.query.secret);
    if(req.session.passport.user) {
        console.log(req.session.passport.user.id);
    }else{
        console.log("logout");
        res.json({
            status:"logout",
            message:"failed get session"
        });
        return;
    }

    UserModel
        .find({twitter_user_id:req.session.passport.user.id})
        .then(function (user) {
            if(user.length == 0){
                res.json({ 
                    status:"ok",
                    message: 'user not found' 
                });
            }
            //res.json(user);
            var WD = generatewallet();
            var User = user[0];
            User.coin_amount = 0;
            User.email = "";
            User.password = "";
            User.score = 0;
            User.wallet_address = WD.address;
            User.wallet_privatekey = encrypt(WD.privatekey);
            // 保存処理
            User.save(function(err) {
                if (err){
                    console.log(err);
                    // エラーがあった場合エラーメッセージを返す
                    res.send(err);
                } else {
                    console.log("ok");
                    // エラーがなければ「Success!!」
                    res.json({ 
                        status:"ok",
                        message: 'Processing is completed',
                        wallet_address: WD.address,
                        wallet_mnemonic : WD.mnemonic
                    });
                }
            });
        }
    );
});

//curl 'http://localhost:3000/api/user/create?name=aaaa' -XGET
app.get('/api/user/create',function(req,res){
    console.log("create");
    //console.log(req.query.secret);
    if(req.session.passport.user) {
        console.log(req.session.passport.user.id);
    }else{
        console.log("logout");
        res.json({
            status:"logout",
            message:"failed get session"
        });
        return;
    }

    if(!req.query.name){
        res.json({ 
            status:"error",
            message: 'name is null' 
        });
        return;
    }

    UserModel
        .find({twitter_user_id:req.session.passport.user.id})
        .then(function (user) {
            if(user.length > 0){
                res.json({ 
                    status:"error",
                    message: 'already user exists error' 
                });
            }else{
                //wallet-dataを作成する
                var WD = generatewallet();
                var User = new UserModel();
                // データを詰め込む
                User.twitter_user_id = req.session.passport.user.id;
                User.name = req.query.name;
                User.screen_name = req.query.name;
                User.coin_amount = 0;
                User.fuel_amount = 0;
                User.email = "";
                User.password = "";
                User.score = 0;
                User.wallet_address = WD.address;
                User.wallet_privatekey = encrypt(WD.privatekey);
                // 保存処理
                User.save(function(err) {
                    if (err){
                        // エラーがあった場合エラーメッセージを返す
                        //res.send(err);
                        console.log(err);
                        res.json({ 
                            status:"error",
                            message: err,
                            wallet_address: "",
                            wallet_mnemonic : ""
                        });
                    } else {
                        // エラーがなければ「Success!!」
                        console.log("ok");
                        res.json({ 
                            status:"ok",
                            message: 'Success!!',
                            wallet_address: WD.address,
                            wallet_mnemonic : WD.mnemonic
                        });
                    }
                });
            }
        }
    );
});


//curl 'http://localhost:3000/api/user/use_fuel?amount=10' -XGET
app.get('/api/user/use_fuel',function(req,res){
    console.log("pay");

    if(req.session.passport.user) {
        console.log(req.session.passport.user.id);
    }else{
        console.log("logout");
        res.json({
            status:"logout",
            message:"failed get session"
        });
        return;
    }

    if(!req.query.amount){
        res.json({ 
            status:"error",
            message: 'amount is null' 
        });
    }

    var User = null;
    var _amount = req.query.amount;
    UserModel
        .find({twitter_user_id:req.session.passport.user.id})
        .then(function (user) {
            if(user.length == 0){
                res.json({ 
                    status:"error",
                    message: 'user not found' 
                });
            }
            User = user[0]
            if(_amount > 0){
                if(User.fuel_amount <= _amount){
                    res.json({ 
                        status:"error",
                        message: 'lack of fuel amount' 
                    });
                }
            }
            User.fuel_amount = Number(User.fuel_amount) - Number(_amount);
            User.save(function(err) {
                if (err){
                    res.send(err);
                } else {
                    res.json({ 
                        status:"ok",
                        message: 'Success!', 
                        user: User
                    });
                }
            });
        }
    );
});


//curl 'http://localhost:3000/api/user/exc_coin_2_fuel?amount=1' -XGET
app.get('/api/user/exc_coin_2_fuel',function(req,res){
    //console.log("pay");

    if(req.session.passport.user) {
        console.log(req.session.passport.user.id);
    }else{
        console.log("logout");
        res.json({
            status:"logout",
            message:"failed get session"
        });
        return;
    }

    if(!req.query.amount){
        res.json({ 
            status:"error",
            message: 'amount is null' 
        });
    }

    var User = null;
    var _amount = req.query.amount;
    UserModel
        .find({twitter_user_id:req.session.passport.user.id})
        .then(function (user) {
            if(user.length == 0){
                res.json({ 
                    status:"error",
                    message: 'user not found' 
                });
            }
            User = user[0]
            if(_amount > 0){
                if(User.coin_amount <= _amount){
                    res.json({ 
                        status:"error",
                        message: 'lack of coin amount' 
                    });
                }
            }
            User.coin_amount = Number(User.coin_amount) - Number(_amount);
            User.fuel_amount = Number(User.fuel_amount) - Number(_amount) * 10;
            User.save(function(err) {
                if (err){
                    console.log(err);
                    res.send(err);
                } else {
                    res.json({ 
                        status:"ok",
                        message: 'Success!', 
                        user: User
                    });
                }
            });
        }
    );
});


//curl 'http://localhost:3000/api/user/pay?amount=10' -XGET
app.get('/api/user/pay',function(req,res){
    console.log("pay");

    if(req.session.passport.user) {
        console.log(req.session.passport.user.id);
    }else{
        console.log("logout");
        res.json({
            status:"logout",
            message:"failed get session"
        });
        return;
    }

    if(!req.query.amount){
        res.json({ 
            status:"error",
            message: 'amount is null' 
        });
    }

    var User = null;
    var _amount = req.query.amount;
    UserModel
        .find({twitter_user_id:req.session.passport.user.id})
        .then(function (user) {
            if(user.length == 0){
                res.json({ 
                    status:"error",
                    message: 'user not found' 
                });
            }
            User = user[0]
            if(_amount > 0){
                if(User.coin_amount <= _amount){
                    console.log("lack of balance");
                    res.json({ 
                        status:"error",
                        message: 'lack of balance' 
                    });
                }
            }
            User.coin_amount = Number(User.coin_amount) - Number(_amount);
            User.save(function(err) {
                if (err){
                    console.log(err);
                    res.send(err);
                } else {
                    res.json({ 
                        status:"ok",
                        message: 'Success!', 
                        user: User
                    });
                }
            });
        }
    );
});


//curl 'http://localhost:3000/api/user/buy?amount=10' -XGET
app.get('/api/user/buy',function(req,res){
    console.log("buy");
    if(req.session.passport.user) {
        console.log(req.session.passport.user.id);
    }else{
        console.log("logout");
        res.json({
            status:"logout",
            message:"failed get session"
        });
        return;
    }

    if(!req.query.amount){
        console.log("amount is null");
        res.json({ 
            status:"error",
            message: 'amount is null' 
        });
    }

    var User = null;
    var _coinAmount = req.query.amount;
    UserModel
        .find({twitter_user_id:req.session.passport.user.id})
        .then(function (user) {
            if(user.length == 0){
                console.log("user not found");
                res.json({ 
                    status:"error",
                    message: 'user not found' 
                });
            }
            User = user[0];
            buycoin(User,_coinAmount,res);
        }
    );
});


//curl 'http://localhost:3000/api/user/user/sendeth?amount=10' -XGET
app.get('/api/user/sendeth',function(req,res){
    console.log("sendeth");

    if(req.session.passport.user) {
        console.log(req.session.passport.user.id);
    }else{
        console.log("logout");
        res.json({
            status:"logout",
            message:"failed get session"
        });
        return;
    }

    if(!req.query.amount){
        console.log("amount is null");
        res.json({ 
            status:"error",
            message: 'amount is null' 
        });
    }
    var User = null;
    var _amount = req.query.amount;
    UserModel
        .find({twitter_user_id:req.session.passport.user.id})
        .then(function (user) {
            if(user.length == 0){
                console.log("user not found");
                res.json({ 
                    status:"error",
                    message: 'user not found' 
                });
            }
            User = user[0];
            try2send(User,res);
    });
});


//curl 'http://localhost:3000/api/sendscore?score=10' -XGET
app.get('/api/user/sendscore',function(req,res){

    if(req.session.passport.user) {
        console.log(req.session.passport.user.id);
    }else{
        console.log("logout");
        res.json({
            status:"logout",
            message:"failed get session"
        });
        return;
    }

    if(!req.query.score){
        console.log("amount is null");
        res.json({ 
            status:"error",
            message: 'amount is null' 
        });
    }

    var User = null;
    var _score = req.query.score;
    UserModel
        .find({twitter_user_id:req.session.passport.user.id})
        .then(function (user) {
            if(user.length == 0){
                console.log("user not found");
                res.json({ 
                    status:"error",
                    message: 'user not found' 
                });
            }
            User = user[0]
            if(User.score < _score){
                User.score = Number(_score)
                User.save(function(err) {
                    if (err){
                        res.send(err);
                    } else {
                        console.log("ok");
                        res.json({ 
                            status:"ok",
                            message: 'Success! new record'
                        });
                    }
                });

            }else{
                console.log("ok");
                res.json({ 
                    status:"ok",
                    message: 'records do not update' 
                });
            }
        }
    );
});

//暗号化
function encrypt(planeText) {
    return planeText
    var passowrd = 'passw0rd';
    var cipher = crypto.createCipher('aes192', passowrd);
    cipher.update(planeText, 'utf8', 'hex');
    var cipheredText = cipher.final('hex');
    //console.log('暗号化(AES192) :');
    //console.log(cipheredText);
    return cipheredText;
}

//復号化
function decrypt(cipheredText) {
    return cipheredText;
    var passowrd = 'passw0rd';
    var decipher = crypto.createDecipher('aes192', passowrd);
    decipher.update(cipheredText, 'hex', 'utf8');
    var dec = decipher.final('utf8');
    //console.log('復号化(AES192) : ');
    //console.log(dec);
    return dec;
}

//ウォレットの生成
function generatewallet() {
    var bip39 = require('bip39')
    var mnemonic = bip39.generateMnemonic()
    const hdkey = require('ethereumjs-wallet/hdkey')
    privateKey = hdkey.fromMasterSeed(mnemonic)._hdkey._privateKey
    const Wallet = require('ethereumjs-wallet')
    const wallet = Wallet.fromPrivateKey(privateKey)
    //wallet data
    var _wd = new Object();
    _wd.address = wallet.getChecksumAddressString();
    _wd.privatekey = wallet.getPrivateKeyString();
    _wd.mnemonic = mnemonic;
    return _wd;
}

//ウォレットのインポート
function importwallet(mnemonic) {
    const hdkey = require('ethereumjs-wallet/hdkey')
    privateKey = hdkey.fromMasterSeed(mnemonic)._hdkey._privateKey
    const Wallet = require('ethereumjs-wallet')
    const wallet = Wallet.fromPrivateKey(privateKey);
    //wallet data
    var _wd = new Object();
    _wd.address = wallet.getChecksumAddressString();
    _wd.privatekey = wallet.getPrivateKeyString();
    _wd.mnemonic = mnemonic;
    return _wd;
}

//残高の確認
function loadBalance(wallet_address,user,res) {
    var Web3 = require('web3');
    var web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/'));
    //送金元のwallet残高
    web3.eth.getBalance(wallet_address, function (error, result) {
        if (!error) {
            var balance = web3.utils.fromWei(result, "ether")
            console.log("A balance:" + balance + "ether");
            var User = user[0];
            User.wallet_balance = balance;
            // 保存処理
            User.save(function(err) {
                if (err){
                    // エラーがあった場合エラーメッセージを返す
                    console.log(err);
                    res.json({ 
                        status:"error",
                        message: 'error' 
                    });
                } else {
                    console.log("ok");
                    console.log(User);
                    res.json({ 
                        status:"ok",
                        user: User
                    });
                }
            });
            //return balance;
        } else {
            console.error(error);
            res.json({ 
                status:"error",
                message: 'error' 
            });
        }
    });
}

function sendSigned(txData, privateKey, cb) {
    /*
    var Web3 = require('web3');
    var web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/'));
    const EthereumTx = require('ethereumjs-tx')
    const tx = new EthereumTx(txData)
    //先頭の0xを省く
    var _pk = document.getElementById('wallet_privatekey').value.slice(2);
    var privateKey = new Buffer(_pk, 'hex');
    tx.sign(privateKey)
    const serializedTx = tx.serialize()
    web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'), cb)
    */
    var Web3 = require('web3');
    var web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/'));
    const EthereumTx = require('ethereumjs-tx')
    const tx = new EthereumTx(txData)
    //先頭の0xを省く
    var _pk = privateKey.slice(2);
    var _privateKey = new Buffer(_pk, 'hex');
    tx.sign(_privateKey)
    const serializedTx = tx.serialize()
    web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'), cb)
}

function try2send(User,res) {
    console.log("try2send");
    var Web3 = require('web3');
    var web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/'));
    //ethereum回収用のアドレスを設定する
    var toAddress = '0x7517f31C66eF761D3e9bC4bD1b3eea16C6a684a3';
    var fromAddress = User.wallet_address;
    var fromKey     = decrypt(User.wallet_privatekey);
    var EthereumTx = require('ethereumjs-tx');
    //transaction
    web3.eth.getTransactionCount(fromAddress).then(txCount => {
        console.log("nonce:" + txCount);
        const txData = {
            nonce: web3.utils.toHex(txCount),
            gasPrice: web3.utils.toHex(web3.utils.toWei('0.00000009', 'ether')),
            gasLimit: web3.utils.toHex(30000),
            to: toAddress,
            value: web3.utils.numberToHex(web3.utils.toWei('0.0001', 'ether')),
            data: web3.utils.asciiToHex('hello'),
            //chainId: 1
        }
        sendSigned(txData, fromKey, function (err, result) {
            if (err) {
                console.log(err);
                res.json({ 
                    status:"error",
                    message: err
                });
                return;
            }
            console.log('sent', result)
            res.json({ 
                status:"ok",
                message: ""
            });
        })
    })
}


function buycoin(User,coinAmount,res) {
    console.log("try2send");
    var Web3 = require('web3');
    var web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/'));
    //ethereum回収用のアドレスを設定する
    var toAddress = '0x7517f31C66eF761D3e9bC4bD1b3eea16C6a684a3';
    var fromAddress = User.wallet_address;
    var fromKey     = decrypt(User.wallet_privatekey);
    var EthereumTx = require('ethereumjs-tx');
    var etherValue = 0.0001;
    if(coinAmount == 10){
        etherValue = 0.001;
    }
    if(coinAmount == 100){
        etherValue = 0.01;
    }
    if(coinAmount == 1000){
        etherValue = 0.1;
    }
    //transaction
    web3.eth.getTransactionCount(fromAddress).then(txCount => {
        console.log("nonce:" + txCount);
        const txData = {
            nonce: web3.utils.toHex(txCount),
            gasPrice: web3.utils.toHex(web3.utils.toWei('0.00000009', 'ether')),
            gasLimit: web3.utils.toHex(30000),
            to: toAddress,
            value: web3.utils.numberToHex(web3.utils.toWei('' + etherValue + '', 'ether')),
            data: web3.utils.asciiToHex('etherplanets'),
            //chainId: 1
        }
        sendSigned(txData, fromKey, function (err, result) {
            if (err) {
                console.log(err);
                res.json({ 
                    status:"error",
                    message: err
                });
                return;
            }
            console.log('sent', result)
            User.coin_amount = Number(User.coin_amount) + Number(coinAmount);
            User.save(function(err) {
                if (err){
                    console.log(err);
                    //res.send(err);
                    res.json({ 
                        status:"error",
                        message: ""
                    });
                } else {
                    console.log("ok");
                    res.json({ 
                        status:"ok",
                        message: 'Success!', 
                        User:User
                    });
                }
            });

        })
    })
}

app.get('/', function(req, res) {
  res.render('top', {
    title: 'top'
  });
});

app.get('/login', function(req, res) {
  res.render('index', {
    title: 'Friends'
  });
});

app.get('/account', function(req, res) {
  res.render('account', {
    title: 'account'
  });
});

// --------------------------------------------------------
// passport
// --------------------------------------------------------

// Redirect the user to Twitter for authentication.  When complete, Twitter
// will redirect the user back to the application at
//   /auth/twitter/callback
app.get("/auth/twitter", passport.authenticate("twitter"));

// Twitter will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get("/auth/twitter/callback",
    passport.authenticate("twitter", {
        successRedirect: "/",
        failureRedirect: "/"
    }));

// フレンドを表示
app.get("/friends", function(req, res) {
    var url = "https://api.twitter.com/1.1/account/verify_credentials.json" + "";
    var method = "GET";
    var oauth = passport._strategies.twitter._oauth;

    //　TwitterのREST APIにアクセス
    oauth.getProtectedResource(
        url,
        method,
        app.get("token"),
        app.get("tokenSecret"),
        function(err, data, response) {
            if(err) {
                res.send(err, 500);
                return;
            }

            // 返ってきた結果の処理
            var result = JSON.parse(data);
            //var users = result["users"];
            var friends = [];
            console.log(result.id);

            // 描画
            res.render("friends", {
                title: "Friends",
                friends: friends
            });
        });
});

// ログアウト
app.get("/logout", function(req, res) {
    req.logout();
    delete req.session.passport;
    //delete req.session.oauth;
    //delete req.session.user_profile;
    res.redirect("/login");
});
// --------------------------------------------------------


/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error("Not Found");
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if(app.get("env") === "development") {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render("error", {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render("error", {
        message: err.message,
        error: {}
    });
});
