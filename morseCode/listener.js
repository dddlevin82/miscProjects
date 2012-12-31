//0 when on
//1 when off
//var repl = require('repl');
var unitTime = 200; //ms
var overPenalty = 1.5;
var underPenalty = 2;
var switchingPenalty = 300;
//var gpio = require('pi-gpio');

var tokenToTimeMap = 
{
	//corresponds to value it was just on, not new value
	'.': function() {return unitTime},
	'-': function() {return 3 * unitTime},
	'|': function() {return unitTime},
	'/': function() {return 3 * unitTime},
	'^': function() {return 4 * unitTime}
}

var tokenIsDown = 
{
	'.': 1,
	'-': 1,
	'|': 0,
	'/': 0,
	'^': 0
}

function Interpretation(string, wrongness) {
	this.string = string;
	this.wrongness = wrongness;
}

function B(isDown, time) {
	return new Blip(isDown, time);
}

function Blip(isDown, time) {
	this.isDown = isDown;
	this.time = time;
}

Blip.prototype = {
	wrongness: function(token) {
		var wrongness = Math.abs(this.isDown - tokenIsDown[token]) * switchingPenalty;
		if (token == '^') {
			return wrongness + Math.max(0, tokenToTimeMap[token]() - this.time)/unitTime;
		}
		return wrongness + Math.abs(tokenToTimeMap[token]() - this.time)/unitTime;
	},
}

var letterToTokensMap = 
{
	'A': '.|-/'			,
	'B': '-|.|.|./'		,
	'C': '-|.|-|./'		,		
	'D': '-|.|./' 		,
	'E': './'			,
	'F': '.|.|-|./'		,
	'G': '-|-|./'		,
	'H': '.|.|.|./'		,
	'I': '.|./'			,
	'J': '.|-|-|-/'		,
	'K': '-|.|-/' 		,
	'L': '.|-|.|./' 	,
	'M': '-|-/'			,
	'N': '-|./'			,
	'O': '-|-|-/'		,
	'P': '.|-|-|./'		,
	'Q': '-|-|.|-/'		,
	'R': '.|-|./'		,
	'S': '.|.|./'		,
	'T': '-/'			,
	'U': '.|.|-/'		,
	'V': '.|.|.|-/'		,
	'W': '.|-|-/'		,
	'X': '-|.|.|-/'		,
	'Y': '-|.|-|-/'		,
	'Z': '-|-|.|./'		,
	' ': '^'
}



//gpio.open(16, 'input', function(){});




function Listener() {
	this.addedLetterEnd = false;
	this.addedSpace = false;
	this.timeStart = 0;
	this.started = false;
	this.lastValues = this.makeInitValues(5, 1);
	this.lastValueIdx = 0;
	this.value = 1;//for mouse
	this.lastAdded = 1;
}

Listener.prototype = {
	listen: function() {
		//gpio.read(16, function(err, value) {
			//1 means up, 0 means down in listener.
			//if (err) throw err;

			var value = this.value;
			
			this.lastValues[this.lastValueIdx] = value;
			this.lastValueIdx ++;
			if (this.lastValueIdx == this.lastValues.length) {
				this.lastValueIdx = 0;
			}
			var curVal = Math.round(arrayAvg(this.lastValues));
			if (curVal != this.lastAdded) {
				var dTime = Date.now() - this.timeStart;
				this.timeStart = Date.now();
				this.lastAdded = curVal;
				if (this.started) {
					interpreter.addBlip(curVal, dTime);
					interpreter.print();
				} else {
					this.started = true;
				}
			}

			 

		//})
	},
	updateValue: function(value) {
		this.value = value; //for mouse
	},
	makeInitValues: function(num, value) {
		var xs = [];
		for (var i=0; i<num; i++) {
			xs.push(value);
		}
		return xs;
	},
	
}


function Interpreter() {
	this.interps = [];
	this.blips = [];
}

Interpreter.prototype = {
	getLastStr: function() {
		return this.interps[this.interps.length-1].string;
	},
	print: function() {
		//console.log(this.interps);
		console.log(this.interps[this.interps.length-1].string);
		//console.log(this.interps[this.interps.length-1].wrongness);
	},
	addBlip: function(isDown, dTime) {
		console.log('new blip is down: ' + isDown);
		console.log('new blip time: ' + dTime);
		var insertLetterEnd = !isDown && dTime > avg(tokenToTimeMap['^']() + tokenToTimeMap['/'](), tokenToTimeMap['/']());
		
		if (insertLetterEnd) {
			console.log('adding letter end with dTime = ' + dTime);
			this.blips.push(new Blip(isDown, tokenToTimeMap['/']()));
			this.addInterpretation();
			this.blips.push(new Blip(isDown, dTime - tokenToTimeMap['/']()));
			this.addInterpretation();
		} else {
			this.blips.push(new Blip(isDown, dTime));
			this.addInterpretation();
		}
	},
	addInterpretation: function() {
		var idx = Math.max(0, this.blips.length - 10);
		var nextInterps = [];
		for (; idx<this.blips.length; idx++) {
			var minWrongness = Number.MAX_VALUE;
			var bestStr = '';
			var prevInterp = this.interps[idx-1];
			if (!prevInterp) {
				var prevWrongness = 0;
				var prevStr = '';
			} else {
				var prevWrongness = prevInterp.wrongness;
				var prevStr = prevInterp.string;
			}
			for (var letter in letterToTokensMap) {
				
				var wrongness = this.evalWrongness(this.blips.slice(idx, this.blips.length), letter);
			
				if (wrongness + prevWrongness < minWrongness) {
					minWrongness = wrongness + prevWrongness;
					bestStr = prevStr + letter;
				}
			}

			nextInterps.push(new Interpretation(bestStr, minWrongness));
		
		}

		var minWrongness = Number.MAX_VALUE;
		var bestStr = '';
		var bestInterp;
		for (var idx=0; idx<nextInterps.length; idx++) {
			if (nextInterps[idx].wrongness < minWrongness) {
				bestInterp = nextInterps[idx];
				minWrongness = nextInterps[idx].wrongness;
			}
		}
		this.interps.push(bestInterp);	
	},
	evalWrongness: function(blips, string) {
		var wrongness = 0;
		var blipIdx = 0;
		for (var letterIdx=0; letterIdx<string.length; letterIdx++) {
			var letter = string[letterIdx];
			var tokens = letterToTokensMap[letter.toUpperCase()];
		
			for (var tokenIdx=0; tokenIdx<tokens.length; tokenIdx++) {
				if (blipIdx == blips.length) {
					return wrongness + (this.numTokensInStr(string) - blipIdx) * overPenalty; 
				}
				var blip = blips[blipIdx];
				wrongness += blip.wrongness(tokens[tokenIdx])
				blipIdx++;
			}
				
		}
		return wrongness + (blips.length - blipIdx) * underPenalty;	
	},
	numTokensInStr: function(str) {
		var numTokens = 0;
		for (var idx=0; idx<str.length; idx++) {
			numTokens += letterToTokensMap[str[idx].toUpperCase()].length;
		}
		return numTokens;
	}
}

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
/*
function testStr(str) {
	var interpreter = new Interpreter();

	var tokens = '';
	for (var strIdx=0; strIdx<str.length; strIdx++) {
		tokens += letterToTokensMap[str[strIdx].toUpperCase()];
	}
	for (var tokenIdx=0; tokenIdx<tokens.length; tokenIdx++) {
		var token = tokens[tokenIdx];
		if (token == '.' || token == '-') {
			interpreter.addBlip(1, tokenToTimeMap[token]()*(1 + Math.random()*.2-.1));
		} else if (token == '^' ) {
			interpreter.addBlip(0, tokenToTimeMap[token]()*.9);
		} else {
			interpreter.addBlip(0, tokenToTimeMap[token]());
		}

	}
	interpreter.print();

	console.log(str);
}
*/
interpreter = new Interpreter();
listener = new Listener();
//testStr('e  e  batf');
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
	


])
*/

//repl.start({eval: myEval});