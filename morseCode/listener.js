//0 when on
//1 when off
var repl = require('repl');
var unitTime = 300; //ms
var extraPenalty = 1;
var switchingPenalty = 3;
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

function Blip(isDown, time) {
	this.down = isDown;
	this.time = time;
}

Blip.prototype = {
	wrongness: function(token) {
		var wrongness = Math.abs(this.down - tokenIsDown[token]) * switchingPenalty;
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

var interpreter = new Interpreter();


function Listener() {
	this.addedLetterEnd = false;
	this.addedSpace = false;
	this.timeStart = 0;
	this.lastValue = 1;
}

Listener.prototype = {
	listen: function() {
		gpio.read(16, function(err, value) {
			
			if (err) throw err;
			
			var dTime = Date.now() - this.timeStart;
			if (value == 1 && dTime > 5 * unitTime) {
				//making it add a letter end character if it's been up for more than halfway to letter end + space
				//this will also add more spaces as you wait
				if (!this.addedLetterEnd) {
					interpreter.addBlip(value, 3.5 * unitTime);
					this.timeStart = Date.now() - 1.5 * unitTime; 
					this.addedLetterEnd = true;
				} else if (!this.addedSpace && dTime > 7 * unitTime) {
					interpreter.addBlip(value, 7 * unitTime);
					this.timeStart = Date.now();
					this.addedSpace = true;
				}
			}
			if (value != this.lastValue) {
				if (!this.addedLetterEnd && !this.addedSpace) {
					this.timeStart = Date.now()
					interpreter.addBlip(!value, dTime); // 0->down, 1->up, so have to flip
				}
				this.addedLetterEnd = false;
				this.addedSpace = false;
			}
		})
	}
}

//should do space as seperate character

function Interpreter() {
	this.interps = [];
	this.blips = [];
}

Interpreter.prototype = {
	getLastStr: function() {
		return this.interps[this.interps.length-1].string;
	},
	print: function() {
		console.log(this.interps);
		console.log(this.interps[this.interps.length-1].string);
		console.log(this.interps[this.interps.length-1].wrongness);
	},
	addBlip: function(value, dTime) {
		this.blips.push(new Blip(value, dTime));
		this.addInterpretation();
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
					return wrongness + (this.numTokensInStr(string) - blipIdx) * extraPenalty; 
				}
				var blip = blips[blipIdx];
				wrongness += blip.wrongness(tokens[tokenIdx])
				blipIdx++;
			}
				
		}
		return wrongness + (blips.length - blipIdx) * extraPenalty;	
	},
	numTokensInStr: function(str) {
		var numTokens = 0;
		for (var idx=0; idx<str.length; idx++) {
			numTokens += letterToTokensMap[str[idx].toUpperCase()].length;
		}
		return numTokens;
	}
}

function myEval(cmd, context, filename, callback) {
	try {
		callback(null, eval(cmd));
	} catch (e) {
		callback(e);
	}
}

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

testStr('e  e  batf');

repl.start({eval: myEval});