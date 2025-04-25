
const WebSocket = require('ws');
const net = require('net');

function openconn(port, host) {

    return new Promise(accept => {

        let client = net.connect({ port: port, host: host }, () => {

            accept(client)
        })

        client.on('error', () => {
            accept(null)
        })
    })
}

function encrypt(num) {
    return (num >>> 5) + ((num << 3) & 0b11111111)
}

const wss = new WebSocket.Server({ host: '127.0.0.1', port: 8083 });

wss.on('connection', function connection(ws) {

    var dataqueue = []
    var conns = []
    var mask = '1'

    async function wswrite(chunk) {
        if (ws.readyState != WebSocket.OPEN) {
            return
        }

        await new Promise(accept => {
            if (mask == '') {
                ws.send(chunk, () => { accept() });
            } else {
                //let tmp = new Uint8Array(chunk)
                //console.log(tmp)
                // for (let i = 0; i < tmp.length; i++) {
                //     //tmp[i]=255-tmp[i]
                //     tmp[i] = (tmp[i] >>> 5) + ((tmp[i] << 3) & 0b11111111)
                // }


                //console.log(tmp)
                //ws.send(tmp)
                ws.send(chunk.map(encrypt), () => { accept() })
            }
        })



    }
    async function forawaitreadable(id, stream) {
        try {
            for await (const data of stream) {
                //console.log('in for await')

                //console.log(data)
                //console.log(data.length)
                if (data.length > 65536) {
                    //console.log('big data')
                    //console.log(data.length)
                }

                let j = 0
                let isover = false
                while (isover == false) {
                    let tmpdata
                    if (data.length - j * 65536 > 65536) {
                        tmpdata = data.slice(j * 65536, (j + 1) * 65536)
                        j++

                    } else {

                        tmpdata = data.slice(j * 65536)
                        isover = true
                    }

                    let dataframe = new Uint8Array(tmpdata.length + 5)
                    dataframe[0] = 200
                    dataframe[1] = (id >>> 8) & 0b11111111
                    dataframe[2] = (id) & 0b11111111
                    dataframe[3] = ((tmpdata.length - 1) >>> 8) & 0b11111111
                    dataframe[4] = (tmpdata.length - 1) & 0b11111111
                    // for (let i = 0; i < tmpdata.length; i++) {
                    //     dataframe[5 + i] = tmpdata[i]
                    // }
                    dataframe.set(tmpdata, 5)
                    //console.log(dataframe)
                    await wswrite(dataframe)

                    // let tmparray = Array.from(tmpdata)
                    // tmparray.unshift((tmpdata.length - 1) & 0b11111111)
                    // tmparray.unshift(((tmpdata.length - 1) >>> 8) & 0b11111111)
                    // tmparray.unshift((id) & 0b11111111)
                    // tmparray.unshift((id >>> 8) & 0b11111111)
                    // tmparray.unshift(200)

                    // wswrite(new Uint8Array(tmparray))

                }
                // let dataframe = new Uint8Array(data.length + 5)
                // dataframe[0] = 200
                // dataframe[1] = (id >>> 8) & 0b11111111
                // dataframe[2] = (id) & 0b11111111
                // dataframe[3] = ((data.length - 1) >>> 8) & 0b11111111
                // dataframe[4] = (data.length - 1) & 0b11111111
                // // for (let i = 0; i < tmpdata.length; i++) {
                // //     dataframe[5 + i] = tmpdata[i]
                // // }
                // dataframe.set(data, 5)
                // //console.log(dataframe)
                // wswrite(dataframe)


            }
        } catch (error) {
            //console.log('in forawait catch')
            //console.log(error)
        }

        //console.log('after for await')

        for (let i = 0; i < conns.length; i++) {
            if (conns[i].id == id) {
                conns[i].isopen = false

                conns[i].conn.destroy()

                break
            }

        }

        let closeframe = new Uint8Array(3)
        closeframe[0] = 252
        closeframe[1] = (id >>> 8) & 0b11111111
        closeframe[2] = (id) & 0b11111111
        wswrite(closeframe)

    }



    ws.on('message', async function message(data) {
        //console.log('received: %s', data);

        //console.log('in message listener');
        //console.log(data);
        //console.log(type);
        if (data) {
            //console.log(data)
            //console.log(dataqueue)
            let tmp = new Uint8Array(data)
            for (let i = 0; i < tmp.length; i++) {
                if (mask == '') {
                    dataqueue.push(tmp[i])
                } else {
                    tmp[i] = (tmp[i] >>> 5) + ((tmp[i] << 3) & 0b11111111)
                    dataqueue.push(tmp[i])
                }
            }
            //console.log(dataqueue)

            let flag = -1
            while (true) {
                if (flag == dataqueue.length || dataqueue.length == 0) {
                    break
                }
                flag = dataqueue.length

                if (dataqueue[0] == 255) {
                    if (dataqueue.length >= 6 && dataqueue.length >= (6 + dataqueue[5])) {

                        //console.log(dataqueue)
                        let raw_id = dataqueue.slice(1, 3)
                        let raw_port = dataqueue.slice(3, 5)
                        let raw_host = dataqueue.slice(6, 6 + dataqueue[5])
                        dataqueue.splice(0, 6 + dataqueue[5])
                        let id = raw_id[0] * 256 + raw_id[1]
                        let port = raw_port[0] * 256 + raw_port[1]
                        let host_buffer = new Uint8Array(raw_host.length)
                        for (let i = 0; i < raw_host.length; i++) {
                            host_buffer[i] = raw_host[i]
                        }
                        let host = new TextDecoder().decode(host_buffer)

                        //console.log(id)
                        //console.log(port)
                        //console.log(host)

                        let conn = await openconn(port, host)
                        if (conn) {
                            conns.push({ conn: conn, id: id, isopen: true })
                            let openokframe = new Uint8Array(3)
                            openokframe[0] = 254
                            openokframe[1] = raw_id[0]
                            openokframe[2] = raw_id[1]
                            wswrite(openokframe)

                            forawaitreadable(id, conn)

                        } else {
                            //send error msg here
                            //console.log('open fail')

                            let openfailframe = new Uint8Array(3)
                            openfailframe[0] = 253
                            openfailframe[1] = raw_id[0]
                            openfailframe[2] = raw_id[1]
                            wswrite(openfailframe)

                        }

                    }
                } else if (dataqueue[0] == 200) {
                    if (dataqueue.length >= 5) {
                        let raw_len = dataqueue.slice(3, 5)
                        let len = raw_len[0] * 256 + raw_len[1] + 1
                        if (dataqueue.length >= (5 + len)) {
                            let raw_id = dataqueue.slice(1, 3)
                            let id = raw_id[0] * 256 + raw_id[1]
                            let data = dataqueue.slice(5, 5 + len)
                            dataqueue.splice(0, 5 + len)
                            // console.log(id)
                            // console.log(len)
                            // console.log(data)
                            for (let i = 0; i < conns.length; i++) {
                                if (conns[i].id == id) {
                                    if (conns[i].isopen) {
                                        let dataarray = new Uint8Array(data.length)
                                        for (let i = 0; i < data.length; i++) {
                                            dataarray[i] = data[i]
                                        }

                                        conns[i].conn.write(dataarray)


                                    } else {
                                        //send error msg here
                                    }
                                    break
                                }
                            }
                        }
                    }
                } else if (dataqueue[0] == 252) {
                    //console.log('in 252')
                    let raw_id = dataqueue.slice(1, 3)
                    let id = raw_id[0] * 256 + raw_id[1]
                    dataqueue.splice(0, 3)

                    for (let i = 0; i < conns.length; i++) {
                        if (conns[i].id == id) {
                            conns[i].isopen = false

                            conns[i].conn.destroy()

                            break
                        }

                    }

                } else if (dataqueue[0] == 251) {
                    //console.log('recieve ping')
                    dataqueue.splice(0, 1)
                    let pong = new Uint8Array(1)
                    pong[0] = 250
                    wswrite(pong)

                } else {
                    //console.log('dataqueue wrong')
                }
            }

        }
    });

});

