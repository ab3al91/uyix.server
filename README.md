# UYIX server

## install
sudo apt-get install curl software-properties-common
curl -sL https://deb.nodesource.com/setup_10.x | sudo bash -
sudo apt-get install -y nodejs
sudo npm install --unsafe-perm

## install WiringPi
sudo apt-get install git-core
git clone https://github.com/zhaolei/WiringOP.git -b h3
cd WiringOP
chmod +x ./build
sudo ./build
cd ..
git clone https://github.com/xpertsavenue/WiringOP-Zero.git
cd WiringOP-Zero
chmod +x ./build
sudo ./build

## install homebridge
sudo apt-get install mc git make g++
sudo apt-get install avahi-daemon avahi-discover libnss-mdns libavahi-compat-libdnssd-dev
sudo npm install -g --unsafe-perm homebridge hap-nodejs node-gyp
cd /usr/lib/node_modules/homebridge/
sudo npm install --unsafe-perm bignum
cd /usr/lib/node_modules/hap-nodejs/node_modules/multicast-dns
sudo node-gyp BUILDTYPE=Release rebuild
homebridge
create config.json
sudo npm install -g homebridge-cmdswitch2
sudo npm install -g homebridge-MotionSensor



## START
sudo node app.js
chech dmesg device port name
check holding vs input

## GIT
git clone "git-url"
cd git-project
git add .
git commit -m "comment"
git push