var exec = require('child_process').exec;


function sineWave(freq, time) {
	var byteRate = 8000;
	
	var numBytes = Math.round(time*(byteRate/8));
	var tone = new Buffer(numBytes);
	for (var x=0; x<numBytes; x++) {
		tone[x] = (127*(Math.sin(x*freq/byteRate) + 1)) & 0xff;
	}
	console.log('done');
	var aplay=exec('aplay');
	aplay.stdin.write(tone);
}

sineWave(2000, 10);
