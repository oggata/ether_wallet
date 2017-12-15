var mongoose     = require('mongoose'); //mongoDBに接続するためのライブラリ
var Schema       = mongoose.Schema; //mongoDBのスキーマを作る

var UserSchema   = new Schema({
	twitter_user_id: Number,
    name :String,
    screen_name: String,
    coin_amount: Number,
    fuel_amount : Number,
    email : String,
    password : String,
    score: Number,
    wallet_address : String,
    wallet_privatekey : String,
    wallet_balance : Number,
    ship_status : String,
    ship_dx : Number,
    ship_dy : Number,
    ship_target_time : Number,
});

// スキーマをモデルとしてコンパイルし、それをモジュールとして扱えるようにする
module.exports = mongoose.model('UserModel', UserSchema);

