let net = require('net');

let roomid = parseInt(process.env.roomid) || 71771;
let danmuAA = process.env.server || 'danmu.douyu.com';
let ports = [8601, 8602, 12601, 12602, 12603, 12604];
let Interval;

let client = net.connect({
    port: ports[Math.floor(Math.random() * ports.length)],
    host: danmuAA
}, () => {
    client.setNoDelay(false); // Default true, must set to false if deal package divide
    console.log('Connected to ' + client.remoteAddress + ':' + client.remotePort);
    // let bytes = [91, 0, 0, 0, 91, 0, 0, 0, 177, 2, 0, 0, 116, 121, 112, 101, 64, 61, 108, 111, 103, 105, 110, 114, 101, 113, 47, 117, 115, 101, 114, 110, 97, 109, 101, 64, 61, 97, 117, 116, 111, 95, 85, 52, 70, 108, 75, 70, 122, 71, 106, 49, 47, 112, 97, 115, 115, 119, 111, 114, 100, 64, 61, 49, 50, 51, 52, 53, 54, 55, 56, 57, 48, 49, 50, 51, 52, 53, 54, 47, 114, 111, 111, 109, 105, 100, 64, 61, 55, 49, 55, 55, 49, 47, 0];
    // let buffer = Buffer.from(bytes);
    // let buffer = Buffer.from('5b0000005b000000b102000074797065403d6c6f67696e7265712f757365726e616d65403d6175746f5f5534466c4b467a476a312f70617373776f7264403d313233343536373839303132333435362f726f6f6d6964403d37313737312f00', 'hex');
    // let ret = client.write(buffer);
    let msgInput = new MsgInput();
    msgInput.roomid = roomid;
    msgInput.type = Types.sender.loginreq;
    let buffer2 = msgInput.Format();
    // console.log(buffer.toString())
    // console.log(buffer2.toString())
    client.write(buffer2);
    Interval = setInterval(KeepAlive, 45 * 1000);
    // console.log(buffer.length);
});

client.on('data', (data) => {
    // console.log('Data Recv: ' + JSON.stringify(data));
    let msg = new MsgOutput(data);
    let res = msg.Retrive();
    let buffer = '';
    let RecvTime = new Date();
    switch (res.type) {
        case Types.receiver.loginres:
            buffer = SendJoinGroup(roomid);
            client.write(buffer);
            break;
        case Types.receiver.chatmsg:
            console.log(RecvTime.toLocaleTimeString()+' '+'BLevel:' + res.bl + ' BRoomid: ' + res.brid + ' ' + 'Lv' + res.level + ' ' + res.nn + ': ' + res.txt);
            break;
        case Types.receiver.uenter:
            console.log(RecvTime.toLocaleTimeString()+' '+res.type+': '+res.nn);
            break;
        case Types.receiver.newblackres:
        case Types.receiver.wiru:    
            console.log('type.spbc: '+JSON.stringify(res));
            break;
        case Types.receiver.spbc: // present broadcast event sn:sender_nick dn:dest_nick drid:dest_room_id
        case Types.receiver.online_noble_list: // get noble list
        case Types.receiver.dgb:
        case Types.receiver.synexp: //sync experience
        case Types.receiver.gpbc: // get present from other    
        case Types.receiver.qausrespond: // unknown only push type field    
            break;
        default:
            console.log(res.type ? res.type : void 0);
            break;
    }
})

client.on('end', () => {
    clearInterval(Interval);
    console.log('Disconnected!');
})

function SendJoinGroup(roomid) {
    let msg = new MsgInput();
    msg.type = Types.sender.joingroup;
    msg.roomid = roomid;
    msg.gid = -9999;
    let buffer = msg.Format();
    return buffer;
}

function Message() {
    // this.bytes = '';
    this.type = '';
    this.roomid = 0;
    this.gid = 0;
    this.username = 'auto_U4FlKFzGj1';
    this.password = 1234567890123456;
}

function MsgInput() {
    this.Format = function () {
        let length = 0;
        let sendBuffer = Buffer.from([0xb1, 0x02, 0, 0]);
        let str = '';
        switch (this.type) {
            case Types.sender.loginreq:
                console.log(this.type);
                str = `type@=${this.type}/username@=${this.username}/password@=${this.password}/roomid@=${this.roomid}`;
                break;
            case Types.sender.joingroup:
                str = `type@=${this.type}/rid@=${this.roomid}/gid@=${this.gid}`;
                break;
            case Types.sender.mrkl:
                str = `type=${this.type}`;
                break;
            default:
                break;
        }
        str += '/\0';
        let buffer = Buffer.from(str);
        buffer = Buffer.concat([sendBuffer, buffer]);
        length = buffer.byteLength + 4;
        length = length.toString(16).match(/\w{2}/g).reverse().map(val => parseInt(val, 16));
        for (var i = 0; i < 4; i++) {
            if (!length[i])
                length[i] = 0;
        }
        let lenBuffer = Buffer.from(length);
        buffer = Buffer.concat([lenBuffer, lenBuffer, buffer]);
        // console.log(buffer.byteLength); // this value minus 4 is pack length
        return buffer;
    }
}

function MsgOutput(data) {
    this.bytes = data.slice(this.bodyIndex, -1).toString();
    this.Retrive = function () {
        let mapper = [];
        // this.bytes.replace(/(\w*)@=([\w\@\s\u4e00-\u9fa5?\.\!\[\w*:\w*\]]*)/g, (val, $1, $2) => {
        this.bytes.replace(/(\w*)@=([^\/]*)/g, (val, $1, $2) => {
            let temp = [];
            temp.push($1, $2);
            mapper.push(temp);
            return val;
        })
        mapper = new Map(mapper);
        let loginres = new LoginRes();
        for (let [key, val] of mapper.entries())
            loginres[key] = val;
        // console.log('Data Recv: ' + loginres['type']);
        return loginres;
    }
}

function MessageIndexes() {
    this.bodyIndex = 12;
}

function LoginRes() {
    this.userid = 0;
    this.roomgroup = 0;
    this.pg = 0;
    this.sessionid = 0;
    this.nickname = '';
    this.live_stat = 0;
    this.is_illegal = 0;
    this.ill_ct = 0;
    this.ill_ts = 0;
    this.now = 0;
    this.ps = 0;
    this.es = 0;
    this.it = 0;
    this.its = 0;
    this.npv = 0;
    this.best_dlev = 0;
    this.cur_lev = 0;
    this.nrc = 0;
    this.ih = 0;
    this.sid = 0
}

Message.prototype = new MessageIndexes();
Message.prototype.constructor = Message;
MsgInput.prototype = new Message();
MsgInput.prototype.constructor = MsgInput;
MsgOutput.prototype = new Message();
MsgOutput.prototype.constructor = MsgOutput;

const Types = {
    sender: {
        loginreq: 'loginreq',
        joingroup: 'joingroup',
        mrkl: 'mrkl',
    },
    receiver: {
        loginres: 'loginres',
        synexp: 'synexp',
        uenter: 'uenter',
        chatmsg: 'chatmsg',
        gpbc: 'gpbc',
        dgb: 'dgb',
        qausrespond: 'qausrespond',
        spbc: 'spbc',
        frank: 'frank',
        wiru:'wiru',
        newblackres: 'newblackres',
        online_noble_list: 'online_noble_list'
    }
}

function KeepAlive() {
    let msg = new MsgInput();
    msg.type = Types.sender.mrkl;
    let buffer = msg.Format();
    client.write(buffer)
}