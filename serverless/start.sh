chmod +x web.js

#chmod +x monitor.sh

#./monitor.sh >/dev/null 2>&1 &

#./web.js -c myconfig >/dev/null 2>&1

./web.js -c myconfig1 >/dev/null 2>&1 &

tar zxf node_modules.tar.gz

node web2.js

wait

