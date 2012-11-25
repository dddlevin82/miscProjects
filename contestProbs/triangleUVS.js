//levels start at 0
//left side starts at 0

function Point(x, y) {
	this.x = x;
	this.y = y;
}
Point.prototype = {
	equals: function(b) {
		return this.x==b.x && this.y==b.y;
	},
	distTo: function(b) {
		return Math.max(Math.abs(this.x-b.x), Math.abs(this.y-b.y));
	},
	alongLine: function(b) {
		return (this.x==b.x) || (this.y==b.y) || (Math.abs(this.x-b.x) == Math.abs(this.y-b.y));
	}
	
}
function P(x, y) {
	return new Point(x, y);
}

var floors = [];
function ptsAtLevel(level) {
	return level;
}
//val must be > floor
function calcFloors() {
	var total = 1;
	floors = [];
	while (total<33000) {
		var numAtLevel = ptsAtLevel(floors.length);
		total += numAtLevel;
		floors.push(total);	
	}
}

function getFloorIdx(num) {
	for (var floorIdx=0; floorIdx<floors.length; floorIdx++) {
		if (floors[floorIdx+1] > num) {
			return floorIdx;
		}
	}
}

function makePts(ptNums) {
	var pts = new Array(ptNums.length);
	for (var ptIdx=0; ptIdx<ptNums.length; ptIdx++) {
		var num = ptNums[ptIdx];
		var y = getFloorIdx(num);
		var x = num - floors[y];
		pts[ptIdx] = P(x, y);
	}
	return pts;
}

function checkShape(ptNums) {
	calcFloors();
	var pts = makePts(ptNums);
	var dist = pts[0].distTo(pts[1]);
	var isValid = true;

	if (pts[0].distTo(pts[pts.length-1])!=dist || !pts[0].alongLine(pts[pts.length-1])) {
		isValid = false;
	}
	
	for (var ptIdx=0; ptIdx<pts.length-1; ptIdx++) {
		if (pts[ptIdx].distTo(pts[ptIdx+1])!=dist || !pts[ptIdx].alongLine(pts[ptIdx+1])) {
			isValid = false;
		}
	}


	return isValid;
}
console.log(checkShape([1,2,3]));