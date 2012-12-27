//0 when on
//1 when off
var tokenStack = [];
var letterStack = [];
var string = '';
var timeStart;
var lastValue = 1;
var unitLen = 300; //ms
var medLen = 3*unitLen;
var longLen = 7*unitLen;
var dashTime = 
var gpio = require('pi-gpio');

var timeToTokenMap = 
{
	//corresponds to value it was just on, not new value
	'0': 
	{
		'unit': '.',
		'med': '-',
		'long': '-'
	},
	'1': 
	{
		'unit': '',
		'med': '|', //between letters
		'long': '^' //between words
	}
}

var tokenToLetterMap = 
{
	'.-': 	'A',
	'-...':	'B',
	'-.-.':	'C',
	'-..': 	'D',
	'.': 	'E',
	'..-.':	'F',
	'--.': 	'G',
	'....':	'H',
	'..': 	'I',
	'.---':	'J',
	'-.-': 	'K',
	'.-..': 'L',
	'--':	'M',
	'-.':	'N',
	'---':	'O',
	'.--.':	'P',
	'--.-':	'Q',
	'.-.':	'R',
	'...':	'S',
	'-':	'T',
	'..-':	'U',
	'...-':	'V',
	'.--':	'W',
	'-..-':	'X',
	'-.--':	'Y',
	'--..':	'Z'
}
	

gpio.open(16, 'input', function(){});


function checkVal() {
	gpio.read(16, function(err, value) {
	
	if (err) throw err;
	
	if (value != lastValue) {
		var dTime = Date.now() - timeStart;
		timeStart = Date.now()
		appendTokenStack(dTime, value);
	}
}

function getNewToken(dTime, value) {
	var type;
	if (dTime < avg(unitLen, medLen)) {
		type = 'unit';
	} else if (dTime < avg(medLen, longLen)) {
		type = 'med';
	} else {
		type = 'long';
	}
	return timeToTokenMap[value][Number(!type)]; //to send what it was just on, not new value
}

function appendTokenStack(dTime, value) {
	var letter;
	var newChar = getNewToken(dTime, value);
	tokenStack.push(newChar);
	if (newChar == '^' || newChar == '|') {
		letter = getNewLetter(tokenStack);
	}
}

function avg(a, b) {
	return (a + b) / 2;
}