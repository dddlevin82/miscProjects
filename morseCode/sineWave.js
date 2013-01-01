var exec = require('child_process').exec;

var str = "";
function sineWave(frequency, duration, bitrate) {

	for (var x=0; x<100000; x++) {
		str += String.fromCharCode((127*(Math.sin(x/3) + 1)) & 0xff);
	}
	//console.log(str);
	console.log('done');
	var aplay=exec('aplay');
	aplay.stdin.write(new Buffer(str, 'ascii'));
	aplay.stdout.pipe(
}
sineWave(1, 2, 3);