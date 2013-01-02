var dgram = require('dgram');
var yelpInt = 100;
var idMax = 10000;
var ip = '127.0.0.1';
var receivedInInterval = 0;
var server = dgram.createSocket('udp4');
var received = [];
var receivedTo = 0;
var packetsToRequest = 1;

server.on('message', function(msg, rinfo) {
	var id = msg.readUInt32LE(0);
	received[id] = msg.slice(4, msg.length);
	receivedInInterval++;
});


function yelp() {
	var toRequest = [];
	for (var packetIdx=receivedTo; packetIdx<received.length; packetIdx++) {
		if (!received[packedIdx]) {
			toRequest.push(packetIdx);
			if (toRequest.length == packetsToRequest) {
				break;
			}
		}
	}
	var request = assembleRequest(toRequest);
	server.send(request, 0, request.length, 2345, ip);
}

function assembleRequest(toRequest) {
	var buffer = new Buffer((4)*toRequest.length);
	for (var reqIdx=0; reqIdx<toRequest.length; reqIdx++) {
		buffer.writeUInt32LE(toRequest[reqIdx], 4*reqIdx);
	}
	return buffer;
}
var yelper = window.setInterval(yelp, yelpInt);
server.bind(1234);