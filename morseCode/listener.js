//0 when down
//1 when up
//var repl = require('repl');
var unitTime = 200; //ms
var overPenalty = 1.5;
var underPenalty = 2;
var switchingPenalty = 300;
var gpio = require('pi-gpio');

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

function Interpretation(string, wrongness, blipCountString, blipCount) {
	this.string = string;
	this.wrongness = wrongness;
	this.blipCountString = blipCountString;
	this.blipCount = blipCount;
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



gpio.open(16, 'input', function(){});




function Listener() {
	this.addedLetterEnd = false;
	this.addedSpace = false;
	this.timeStart = 0;
	this.started = false;
	this.lastValues = this.makeInitValues(5, 0);
	this.lastValueIdx = 0;
	this.value = 0;//for mouse
	this.lastAdded = 0;
}

Listener.prototype = {
	listen: function() {
		var self = this;
		gpio.read(16, function(err, value) {
			if (err) throw err;
			self.lastValues[self.lastValueIdx] = value;
			self.lastValueIdx ++;
			if (self.lastValueIdx == self.lastValues.length) {
				self.lastValueIdx = 0;
			}
			var curVal = Math.round(arrayAvg(self.lastValues));
			if (curVal != self.lastAdded) {
				var dTime = Date.now() - self.timeStart;
				self.timeStart = Date.now();
				self.lastAdded = curVal;
				if (self.started) {
					interpreter.addBlip(!curVal, dTime);
					interpreter.print();
				} else {
					console.log('starting');
					self.started = true;
				}
			}

			 

		})
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
	this.adjustPaceNumBlips = 20;
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
		if (this.blips.length%10 == 0) {
			this.adjustPace();
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
				var prevBlipCount = 0;
			} else {
				var prevWrongness = prevInterp.wrongness;
				var prevStr = prevInterp.string;
				var prevBlipCount = prevInterp.prevBlipCount;
			}
			for (var letter in letterToTokensMap) {
				
				var wrongness = this.evalWrongness(this.blips.slice(idx, this.blips.length), letter);
			
				if (wrongness + prevWrongness < minWrongness) {
					minWrongness = wrongness + prevWrongness;
					bestStr = prevStr + letter;
				}
			}
			
			nextInterps.push(new Interpretation(bestStr, minWrongness, undefined,  this.blips.length));
		
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
		bestInterp.blipCountString = this.numTokensInStr(bestInterp.string);
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
	},
	adjustPace: function() {
		var unitTimes = [];
		var interp = this.interps[this.interps.length-1];
		var string = interp.string;
		var blipCount = interp.blipCount;
		//may be off by 1
		var blipCountString = interp.blipCountString;
		var countBackFrom = Math.min(blipCount, blipCountString) - 1;
		var blipIdx = blipCountString - 1;
		var stopAt = countBackFrom - this.adjustPaceNumBlips;
		
		for (var letterIdx=string.length-1; letterIdx>=0; letterIdx--) {
			var letter = string[letterIdx];
			var tokens = letterToTokensMap[letter];
			
			for (var tokenIdx=tokens.length-1; tokenIdx>=0; tokenIdx--) {
				var token = tokens[tokenIdx];
				if (blipIdx <= countBackFrom) {
					if (token == '^') {
					} else if (token == '/' || token == '-') {
						unitTimes.push(this.blips[blipIdx].time/3);
					} else {
						unitTimes.push(this.blips[blipIdx].time);
					}
				}
				
				blipIdx--;
				
				if (blipIdx < 0 || blipIdx == stopAt) {
					unitTime = arrayAvg(unitTimes);
					console.log('new unit time ' + unitTime);
					return;
				}
				
			}
			
		}
		
	},
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

function avg(a, b) {
		return (a + b) / 2;
}
function feedInput(blips) {

	for (var blipIdx=0; blipIdx<blips.length; blipIdx++) {
		interpreter.addBlip(blips[blipIdx].isDown, blips[blipIdx].time);
		interpreter.print();
	}
}

function listen() {
	listener.listen();
}

setInterval(listen, 10);

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