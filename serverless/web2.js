const net = require('net');
const WebSocket = require('ws');
const { Server } = require('ssh2');
const { utils: { generateKeyPairSync } } = require('ssh2');

const allowedUser = 'foo';
const allowedPassword = 'bar';

const port = 8083;

var listenunixpath = "\0ximiximiunixSocket";

if (process.platform != 'linux') {
    listenunixpath = "/tmp/ximiximiunixSocket"
    require('fs').unlink(listenunixpath, () => { })
}


let keys = generateKeyPairSync('ed25519');
//console.log(keys.private)
//console.log(keys.public)


function runssh2() {
    return new Promise((resovle) => {
        new Server({ hostKeys: [keys.private] }, (client) => {
            console.log('Client connected!');

            client.on('authentication', (ctx) => {

                switch (ctx.method) {
                    case 'password':
                        if (ctx.username != allowedUser || ctx.password != allowedPassword)
                            return ctx.reject();
                        break;
                    default:
                        return ctx.reject();
                }

                ctx.accept();

            }).on('ready', () => {
                console.log('Client authenticated!');

                client.on('tcpip', (accept, reject, info) => {
                    //console.log('tcpip' + info.destIP + info.destPort + info.srcIP + info.srcPort)

                    let outclient = new net.Socket()
                    outclient.connect({ port: info.destPort, host: info.destIP }, () => {
                        const clientSocket = accept();
                        if (clientSocket) {
                            clientSocket.pipe(outclient)
                            outclient.pipe(clientSocket)
                            clientSocket.on('error', (err) => {
                                //console.error(` c [ERROR] - ${err}`);
                                outclient.destroy();
                            });
                            outclient.on('error', (err) => {
                                //console.error(` client [ERROR] - ${err}`);
                                clientSocket.destroy();
                            });
                            clientSocket.on('end', () => {
                                outclient.destroy();
                            })
                            outclient.on('end', () => {
                                clientSocket.destroy();
                            })
                        } else {
                            outclient.destroy();
                            reject()
                        }

                    })
                    outclient.on('error', (err) => {
                        //console.error(` client [ERROR] - ${err}`);
                        reject()
                    });

                });
            }).on('close', () => {
                console.log('Client disconnected');
            }).on('error', (e) => {
                console.log('Client error ' + e);
            });
        }).listen(listenunixpath, function () {
            console.log('Listening on port ');
            resovle(true)
        }).on('error', () => {
            resovle(false)
        });

    })
}





async function runws() {

    await runssh2()

    var ws_openshift = new WebSocket.Server({
        host: '127.0.0.1',
        port: port
    });

    ws_openshift.on('connection', (cws, req) => {
        let tws_
        var messageBuffer = [];

        let obj = { 'c_ws': cws, 't_ws': tws_, 'messageBuffer': messageBuffer }

        obj.c_ws.on('message', function (message) {
            if (obj.t_ws) obj.t_ws.write(message);
            else if (obj.messageBuffer) obj.messageBuffer.push(message);
        });


        let t_tcp = new net.Socket()
        t_tcp.connect(listenunixpath, () => {
            if (obj.c_ws.readyState != WebSocket.OPEN) {
                t_tcp.destroy()
                return
            }

            obj.t_ws = t_tcp

            obj.t_ws.on('data', function (message) {
                if (obj.c_ws.readyState == WebSocket.OPEN) obj.c_ws.send(message);
            });

            obj.t_ws.on('close', function () {
                obj.c_ws.close();
            });

            obj.t_ws.on('error', function (e) {
                obj.c_ws.close();
            });

            obj.c_ws.on('close', function () {
                obj.t_ws.destroy();
                obj.messageBuffer = undefined;
            });

            obj.c_ws.on('error', function (e) {
                obj.t_ws.destroy();
                obj.messageBuffer = undefined;
            });

            for (let message of obj.messageBuffer) obj.t_ws.write(message);
            obj.messageBuffer = undefined;

        })
        t_tcp.on('error', (err) => {
            //console.error(` client [ERROR] - ${err}`);
            cws.close()
        });

    })

}


runws()