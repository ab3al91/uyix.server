# UYIX server

## install
1. sudo apt-get install curl software-properties-common
2. curl -sL https://deb.nodesource.com/setup_10.x | sudo bash -
3. sudo apt-get install -y nodejs
4. sudo npm install --unsafe-perm

## install WiringPi
1. sudo apt-get install git-core
2. git clone https://github.com/zhaolei/WiringOP.git -b h3
3. cd WiringOP
4. chmod +x ./build
5. sudo ./build
6. cd ..
7. git clone https://github.com/xpertsavenue/WiringOP-Zero.git
8. cd WiringOP-Zero
9. chmod +x ./build
10. sudo ./build

## install homebridge
1. sudo apt-get install mc git make g++
2. sudo apt-get install avahi-daemon avahi-discover libnss-mdns libavahi-compat-libdnssd-dev
3. sudo npm install -g --unsafe-perm homebridge hap-nodejs node-gyp
4. cd /usr/lib/node_modules/homebridge/
5. sudo npm install --unsafe-perm bignum
6. cd /usr/lib/node_modules/hap-nodejs/node_modules/multicast-dns
7. sudo node-gyp BUILDTYPE=Release rebuild
8. homebridge
9. create config.json
10. sudo npm install -g homebridge-cmdswitch2
11. sudo npm install -g homebridge-MotionSensor



## START
1. sudo node app.js
2. chech dmesg device port name
3. check holding vs input

## GIT
1. git clone "git-url"
2. cd git-project
3. git add .
4. git commit -m "comment"
5. git push