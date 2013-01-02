var dgram = require('dgram');
var fs = require('fs');
var server = dgram.createSocket('udp4');
//var idMax = 10000;//Math.pow(31)-1;
var lastHoleIdx = 0;
var id = 0;
var bufferLen = 10;
var data;
var packetsReceived = 0;
var packetsToSend = 0;
var client = dgram.createSocket('udp4');
var toResend = [];
var fileBuffer;
//var buffer = new Buffer(100);
fs.readFile('wobble.txt', function(err, data) {
	if (err) {
		return console.log(err);
	}
	fileBuffer = data;
	sendFile(data);
});
function sendFile(fileBuffer) {
	for (var byteIdx=0; byteIdx<fileBuffer.length; byteIdx+=bufferLen) {
		var toSend = new Buffer(bufferLen + 4)
		toSend.fill(0);
		toSend.writeUInt32LE(id, 0)
		fileBuffer.copy(toSend, 4, byteIdx, Math.min(byteIdx+bufferLen, fileBuffer.length))
		console.log(toSend);
		client.send(toSend, 0, toSend.length, 1234, '127.0.0.1', function() {console.log('Sent!')});
		id++;

	}
}

function sendChunk() {
	var sent = 0;
	for (var resendIdx=0; resendIdx<packetsToSend; resendIdx++) {
		sent++;
		
	}
	
}

function sendIdx(idx) {
		var toSend = new Buffer(bufferLen + 4)
		toSend.fill(0);
		toSend.writeUInt32LE(id, 0)
		fileBuffer.copy(toSend, 4, idx, Math.min(idx+bufferLen, fileBuffer.length))
		console.log(toSend);
		client.send(toSend, 0, toSend.length, 1234, '127.0.0.1', function() {console.log('Sent!')});
}

window.setInterval(sendChunk, 10);






server.on('message', function(msg, err) {
	var packetReq = [];
	for (var byteIdx=0; byteIdx<msg.length; byteIdx+=4) {
		packetReq.push(msg.readInt32LE(byteIdx));
	}
	toResend = packetReq;
	packetsReceived = toResend[0] - lastHoleIdx;
	lastHoleIdx = toResent[0];
	packetsToSend = Math.round(packetsReveived/10);
	
	

})

/*
buffer.fill(0);
buffer.write(rndStr(buffer.length));
var client = dgram.createSocket('udp4');

client.send(buffer, 0, buffer.length, 1234, '192.168.1.6', function() {console.log('WOO');client.close()});
*/


server.bind(2345);


function rndStr(len) {
	var str = '';
	for (var i=0; i<len; i++) {
		str += Math.floor(Math.random()*10);
	}
	return str;
}