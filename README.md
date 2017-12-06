# ether_wallet
#npmをinstallする(ubuntu)
$ sudo apt-get install build-essential
$ sudo apt-get remove --purge nodejs
$ sudo apt-get install curl
$ curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
$ sudo apt-get install -y nodejs
$ sudo npm install npm@latest -g

#mongodb
$ sudo apt-get install ntp
$ sudo apt-get install mongodb
$ mongo -version
$ sudo ufw status
$ sudo ufw allow 3000 <-Mongodbで使う
$ sudo ufw allow 27017 <-Mongodbで使う
$ sudo ufw allow 27018 <-Mongodbのwebconsoleで使う
$ sudo ufw allow 28017 <-Mongodbのwebconsoleで使う
//許可ポート以外閉じる
sudo ufw default deny
$ sudo service mongodb start
or
$ sudo service mongodb restart

show dbs;
use ExpressAPI;
db.usermodels.update({name:'aaa'},{$set:{coin_amount:100})
db.usermodels.update({"name": "aaa"}, {$set:{"coin_amount": 100}})
db.usermodels.find({name:'aaa'})
db.usermodels.drop()


#config.json
{
  "development": {
    "SERVER": "http://localhost/",
    "MONGO_DB":"mongodb://127.0.0.1:27017/ether",
    "TWITTER_CONSUMER_KEY":"aaaa",
    "TWITTER_CONSUMER_SECRET":"aaaa",
    "TWITTER_CALLBACK_URL":"http://localhost:3000/auth/twitter/callback"
  },
  "production": {
    "SERVER": "http://domain/",
    "MONGO_DB":"mongodb://127.0.0.1:27017/ether",
    "TWITTER_CONSUMER_KEY":"aaaa",
    "TWITTER_CONSUMER_SECRET":"aaaa",
    "TWITTER_CALLBACK_URL":"http://domain:3000/auth/twitter/callback"
  }
}

#使い方
$ cd /home/ubuntu
$ git clone git@github.com:oggata/ether_wallet.git
$ cd ether_wallet
$ sudo npm install
$ sudo npm install forever -g

#API+WEBサーバー起動
$ NODE_ENV=production npm start

#foreverで起動
$ sudo su -
$ ndenv rehash
$ NODE_ENV=production forever start startup/www
$ forever restart startup/www
$ forever stop startup/www

#nginxの設定
vim /etc/nginx/conf.d/node-app.conf

upstream node-sampleapp {
    server localhost:3000;
}

server {
    listen       80;
    server_name  10.211.55.2;
    proxy_redirect                          off;
    proxy_set_header Host                   $host;
    proxy_set_header X-Real-IP              $remote_addr;
    proxy_set_header X-Forwarded-Host       $host;
    proxy_set_header X-Forwarded-Server     $host;
    proxy_set_header X-Forwarded-For        $proxy_add_x_forwarded_for;
    location / {
        proxy_pass http://node-sampleapp/;
    }
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {  
    root   /usr/share/nginx/html;
    }
}


sudo service nginx reload