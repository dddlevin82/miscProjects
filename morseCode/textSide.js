//0 when down
//1 when up
var repl = require('repl');

var dgram = require('dgram');
clientIP = '192.168.2.23';
clientPort = 2345;
var server = dgram.createSocket('udp4');
var client = dgram.createSocket('udp4');

server.on('message', function(msg, err) {
	console.log('got message');
	var type = toStrFromASCII(msg.slice(0, 1));
	console.log(type);
	console.log(msg.readInt32LE(1));
	if (type == 's' ) {
		var idx = msg.readInt32LE(1);
		var msg = toStrFromASCII(msg.slice(5, msg.length));
		receiver.receive(idx, msg);
	} else if (type == 'r') {
		var sendAfterIdx = msg.readInt32LE(1);
		sender.sendStartingAfter(sendAfterIdx);
	}

	console.log(toStrFromASCII(msg.slice(5, msg.length)));
})

function toStrFromASCII(ASCII) {
	var str = '';
	for (var byteIdx=0; byteIdx<ASCII.length; byteIdx++) {
		str += String.fromCharCode(ASCII[byteIdx]);
	}
	return str;
}

//receives strings from the morse code side
//.msg holds all the text send
function Receiver() {
	this.msg = '';
}

Receiver.prototype = {
	receive: function(idx, msg) {
		this.msg = this.msg.slice(0, idx) + msg;
		console.log(this.msg);
	},

	getMsg: function() {
		return this.msg;
	},

}

function Requester() {
	
}
//requests strings from the morse code side
//will receive nothing if last interp already sent
Requester.prototype = {
	request: function() {
		var type = 'r';
		var msg = receiver.getMsg();
		var idx = msg.length - 1;
		var last10 = this.last10(msg);
		var req = new Buffer(15);
		req.write(type);
		req.writeInt32LE(idx, 1);
		req.write(last10, 5);
		client.send(req, 0, req.length, clientPort, clientIP);
	},
	last10: function(str) {
		return str.slice(str.length - 10, str.length);
	},
}

//sends strings to the morse code side
function Sender() {
	this.msgs = [];
}

Sender.prototype = {
	//touch
	addMsg: function(str) {
		this.msgs.push(this.sanitizeStr(str));
	},
	send: function(idx) {
		if (!idx) idx = this.msgs.length - 1;
		var str = this.msgs[idx];
		var toSend = makeBuffer('s', idx, str);
		client.send(buffer, 0, toSend, clientPort, clientIP);
	},
	sendStartingAfter: function(idx) {
		for (var msgIdx=idx + 1; msgIdx<this.msgs.length; msgIdx++) {
			this.send(msgIdx);
		}
	},
	makeBuffer: function(dir, idx, str) {
		var buffer = new Buffer(5 + str.length);
		buffer.write('s');
		buffer.writeInt32LE(idx, 1);
		buffer.write(str, 5);
		return buffer;
	},
	sanitizeStr: function(str) {
		str = str.toUpperCase();
		var sanitized = '';
		for (var strIdx=0; strIdx<str.length; strIdx++) {
			var charCode = str.charCodeAt(strIdx);
			if (charCode > 64 && charCode < 91) {
				sanitized += str[strIdx];
			}
		}
		return sanitized;
	},
}

function send(str) {
	sender.addMsg(str);
	sender.send();
}

var sender = new Sender();
var requester = new Requester();
var receiver = new Receiver();
server.bind(1234);















function arrayAvg(array) {
	var sum = 0;
	for (var i=0; i<array.length; i++) {
		sum += array[i];
	}
	return sum/array.length;
}

function myEval(cmd, context, filename, callback) {
	try {
		callback(null, eval(cmd));
	} catch (e) {
		callback(e);
	}
}

function request() {
	requester.request();
}

function avg(a, b) {
		return (a + b) / 2;
}

setInterval(request, 50);

/*
feedInput([
	B(1, 100),
	B(0, 400),
	B(1, 300),
	B(0, 300),
	B(1, 100),
	B(0, 5800),
	B(1, 100),
	B(0, 300),
	B(1, 110)


])
*/

repl.start({eval: myEval});