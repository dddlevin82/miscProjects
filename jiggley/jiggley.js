
function turn() {

}


function Jiggley(canvasElement, drawCanvas, rCircle, fillCol) {
	this.cElement = canvasElement;
	this.c = drawCanvas;
	this.k = 5;
	this.m = 5;
	this.drawingTools = new DrawingTools(this.cElement, this.c);
	this.rCircle = rCircle;
	this.fillCol = fillCol;
	this.pxPerPt = 10;
	this.center = P(this.rCircle, this.rCircle);
	this.sideLen = 2*this.rCircle;
	this.ptsPerRow = Math.round(this.sideLen/this.pxPerPt) + 1;
	
	this.nodes = this.defineNodes();
	this.lines = this.defineSprings(this.nodes);
}

Jiggley.prototype = {
	draw: function() {
		var lines = this.lines;
		for (var lineIdx=0; lineIdx<lines.length; lineIdx++) {
			this.drawingTools.line(lines[lineIdx].a, lines[lineIdx].b, this.fillCol);
		}
	},
	defineNodes: function() {
		
		var ptsPerBlock = 10;
		var nodes = this.makeBlankGrid(this.ptsPerRow);
		var numBlocks = Math.ceil(this.ptsPerRow/ptsPerBlock);
		for (var blockIdxX=0; blockIdxX<numBlocks; blockIdxX++) {
			for (var blockIdxY=0; blockIdxY<numBlocks; blockIdxY++) {
				
				for (var xIdx=blockIdxX*ptsPerBlock; xIdx<this.ptsPerRow; xIdx++) {
					for (var yIdx=blockIdxY*ptsPerBlock; yIdx<this.ptsPerRow; yIdx++) {
						var node = new Node(xIdx*this.pxPerPt, yIdx*this.pxPerPt, this.m);
						if (this.center.distSqrTo(node) <= this.rCircle*this.rCircle) {
							nodes[xIdx][yIdx] = node;
						} else {
							nodes[xIdx][yIdx] = undefined;
						}
					}
				}
				
			}
		}
		return nodes;
	},
	defineSprings: function(nodes) {
		var springs = [];
		var springsTaken = this.makeSpringsTaken(nodes);
		var seedPtIdx = this.getSeedPtIdx(nodes);
		var borderPtIdxs = [seedPtIdx];
		var borderPtIdxsLast = [];
		while (borderPtIdxs.length>0) {
			borderPtIdxsLast = borderPtIdxs;
			borderPtIdxs = [];
			for (var borderPtIdx=0; borderPtIdx<borderPtIdxsLast.length; borderPtIdx++) {
				var idx = borderPtIdxsLast[borderPtIdx];
				var x = idx.xIdx;
				var y = idx.yIdx;
				for (var dx=-1; dx<=1; dx++) {
					for (var dy=-1; dy<=1; dy++) {
						var dir = V(dx, dy);
						if ((dir.dx!=0 || dir.dy!=0) && this.canMakeSpring(idx, nodes, springsTaken, dir)) {
							springs.push(new Spring(nodes[x][y], nodes[x+dir.dx][y+dir.dy], dir.mag(), this.k));
							springsTaken[x][y][dir.dx][dir.dy] = true;
							springsTaken[x+dir.dx][y+dir.dy][-dir.dx][-dir.dy] = true;
							borderPtIdxs.push({xIdx:x+dir.dx, yIdx:y+dir.dy});
						}
					}
				}
			}
		}
		return springs;
	},
	canMakeSpring: function(idx, nodes, springsTaken, dir) {
		var horizontal, vertical;
		var srcX = idx.xIdx;
		var srcY = idx.yIdx;
		var targetX = srcX + dir.dx;
		var targetY = srcY + dir.dy;
		if (nodes[targetX] && nodes[targetX][targetY]) {
			var target = nodes[targetX][targetY];
		}
		var srcTaken = springsTaken[srcX][srcY][dir.dx][dir.dy];
		if (target) {
			var targetTaken = springsTaken[targetX][targetY][-dir.dx][-dir.dy];
		}
		if (target && !srcTaken && !targetTaken) {
			if (dir.magSqr()>1) { //trying to make diagonal
				if (nodes[srcX+dir.dx] && nodes[srcX+dir.dx][srcY]) {
					horizontal = nodes[srcX+dir.dx][srcY];
				} else {
					horizontal = undefined;
				}
				vertical = nodes[srcX][srcY+dir.dy];
				if (horizontal && vertical) {
					horizontalTakens = springsTaken[srcX+dir.dx][srcY];
					verticalTakens = springsTaken[srcX][srcY+dir.dy];
					var rotatedDir = dir.copy().perp('cw');
					return !horizontalTakens[rotatedDir.dx][rotatedDir.dy] && !verticalTakens[-rotatedDir.dx][-rotatedDir.dy];
				} 
			} 
			return true;
		} else {
			return false;
		}
		
		
		
	},
	makeSpringsTaken: function(nodes) {
		springsTaken = this.makeBlankGrid(nodes.length);
		for (var x=0; x<nodes.length; x++) {
			for (var y=0; y<nodes[0].length; y++) {
				if (nodes[x][y] != undefined) {
					springsTaken[x][y] = {'-1': {'-1':false, '0':false, '1':false}, '0': {'-1':false, '0':false, '1':false}, '1': {'-1':false, '0':false, '1':false}} 
				}
			
			}
		}
		return springsTaken;
	},
	getSeedPtIdx: function(nodes) {
		while (true) {
			var xIdx = Math.floor(Math.random()*nodes.length);
			var yIdx = Math.floor(Math.random()*nodes[0].length);
			if (nodes[xIdx][yIdx]) {
				return {xIdx:xIdx, yIdx:yIdx};
			}
		}
	},
	
	
	makeBlankGrid: function(ptsPerRow) {
		var blankList = new Array(ptsPerRow);
		for (var ptIdx=0; ptIdx<ptsPerRow; ptIdx++) {
			blankList[ptIdx] = new Array(ptsPerRow);
		}
		return blankList;
	}

}

function Spring(a, b, lo, k) { 
	this.a = a;
	this.b = b;
	this.lo = lo;
	this.k = k;

}

function Node(x, y, m) {
	this.x = x;
	this.y = y;
	this.m = m;
	this.dx = 0;
	this.dy = 0;
}

_.extend(Node.prototype, Point.prototype, 
	{




	}
);