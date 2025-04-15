chmod +x web.js

if [ -z $PORT ];then
	PORT=8888
fi

#echo $PORT

./web.js -c myconfig2 >/dev/null 2>&1 &

sleep 1

rm myconfig2
rm web.js
rm start.sh

ls

wait
