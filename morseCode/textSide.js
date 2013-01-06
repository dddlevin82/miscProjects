//0 when down
//1 when up
//var repl = require('repl');

var dgram = require('dgram');

var server = dgram.createSocket('udp4');
var client = dgram.createSocket('udp4');

server.on('message', function(msg, err) {
	console.log(toStrFromASCII(msg.slice(5, msg.length)));
})

function toStrFromASCII(ASCII) {
	var str = '';
	for (var byteIdx=0; byteIdx<ASCII.length; byteIdx++) {
		str += String.fromCharCode(ASCII[byteIdx]);
	}
	return str;
}

function Sender() {
	this.msgs = [];
}

Sender.prototype = {
	//touch
	addMsg: function(str) {
		this.msgs.push(this.sanitizeStr(str);
	},
	send: function(idx) {
		var str = this.msgs[idx];
		var toSend = makeBuffer('s', idx, str);
		client.send(buffer, 0, toSend, 2345, '127.0.0.1');
	},
	makeBuffer: function(dir, idx, str) {
		var buffer = new Buffer(5 + str.length);
		buffer.write('s');
		buffer.writeUInt32LE(idx, 1);
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
	str = str.toUpperCase();
	var strToSend = '';
	for (var strIdx=0; strIdx<str.length; strIdx++) {
		var charCode = str.charCodeAt(strIdx);
		if (charCode > 64 && charCode < 91) {
			strToSend += str[strIdx];
		}
	}
	var buffer = mak
}

var sender = new Sender();

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



function avg(a, b) {
		return (a + b) / 2;
}
function feedInput(blips) {

	for (var blipIdx=0; blipIdx<blips.length; blipIdx++) {
		interpreter.addBlip(blips[blipIdx].isDown, blips[blipIdx].time);
		interpreter.print();
	}
}


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

//repl.start({eval: myEval});