var depth = 0;
dict = 
{
0:'zero',
1:'one',
2:'two',
3:'three',
4:'four',
5:'five',
6:'six',
7:'seven',
8:'eight',
9:'nine',
10:'ten',
11:'eleven',
12:'twelve',
13:'thirteen',
14:'fourteen',
15:'fifteen',
16:'sixteen',
17:'seventeen',
18:'eighteen',
19:'nineteen',
20:'twenty',
21:'twenty-one',
22:'twenty-two',
23:'twenty-three',
24:'twenty-four',
25:'twenty-five',
26:'twenty-six',
27:'twenty-seven',
28:'twenty-eight',
29:'twenty-nine',
30:'thirty',
31:'thirty-one',
32:'thirty-two',
33:'thirty-three',
34:'thirty-four',
35:'thirty-five',
36:'thirty-six',
37:'thirty-seven',
38:'thirty-eight',
39:'thirty-nine',
40:'forty',
41:'forty-one',
42:'forty-two',
43:'forty-three',
44:'forty-four',
45:'forty-five',
46:'forty-six',
47:'forty-seven',
48:'forty-eight',
49:'forty-nine',
50:'fifty',

};


letterCounts = //values that work
{
a:6,
b:1,
c:3,

d:3,
e:37,
f:6,
}/*g:3,
h:9,
i:12,
j:1,
k:1,
l:2,
m:3,
n:22,
o:13,
p:3,
q:1,
r:14,
s:29,
t:24,
u:5,
v:6,
w:7,
x:4,
y:5,
z:1,
};
*/
var template = "this computer-generated pangram contains %(a)s a's, %(b)s b's, %(c)s c's, %(d)s d's, %(e)s e's, and %(f)s f's"//, %(g)s g's, %(h)s h's, %(i)s i's, %(j)s j's, %(k)s k's, %(l)s l's, %(m)s m's, %(n)s n's, %(o)s o's, %(p)s p's, %(q)s q's, %(r)s r's, %(s)s s's, %(t)s t's, %(u)s u's, %(v)s v's, %(w)s w's, %(x)s x's, %(y)s y's, and %(z)s z's"; 
var workingSent = "";
function initGuess() {
	for (var letter in letterCounts) {
		letterCounts[letter] = Math.round(Math.random()*10);
	}
	workingSent = buildSentence(letterCounts);

}

function buildSentence(counts) {
	var matchup = {};
	for (letter in counts) {
		var number = dict[counts[letter]];
		matchup[letter] = number;
	}
	
	return sprintf(cutApostrophes(counts) , matchup);
}
function cutApostrophes(counts) {
	var cutStr = template;
	for (var letter in counts) {
		if (counts[letter] == 1) {
			var toSearch = letter + "'s";
			cutStr = cutStr.replace(toSearch, letter);
		}
	}
	return cutStr;
}


function getCounts(sent) {
	var alphabet = lightCopy(letterCounts);
	
	for (letter in alphabet) {
		var count = getCount(sent, letter);
		if (count > 50) {
			console.log('Letter out of range! ' + count);
		}
		alphabet[letter] = getCount(sent, letter);
	
	}
	return alphabet;
}

function getCount(sent, letter) {
	var count = 0;
	while (sent.indexOf(letter) != -1) {
		var index = sent.indexOf(letter);
		var a = sent.substring(0, index);
		var b = sent.substring(index+1, sent.length);
		sent = a + b;
		count++;
	}
	return count;

}

function lightCopy(obj) {
	var newObj = {};
	for (var item in obj) {
		newObj[item] = obj[item];
	}
	return newObj;
}

function iterate(sent) {
	var newCounts = getCounts(sent);
	var newSent = buildSentence(newCounts);
	if (newSent == sent) {
		console.log('WIN: ' + newSent);
	} else {
		depth++;
		console.log(depth);
		console.log('Deeper with ' + newSent);
		iterate(newSent);
	}


}
initGuess();
//iterate(workingSent);