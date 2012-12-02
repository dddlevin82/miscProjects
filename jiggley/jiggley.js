
function turn() {

}


function Jiggley(canvasElement, drawCanvas, rCircle, fillCol) {
	this.cElement = canvasElement;
	this.c = drawCanvas;
	this.drawingTools = new DrawingTools(this.cElement, this.c);
	this.rCircle = rCircle;
	this.fillCol = fillCol;
	this.pxPerPt = 20;
	var pts = this.definePts();
	this.tris = this.definteTris(pts);
	this.center = P(this.rCircle, this.rCircle);
	this.sideLen = 2*this.rCircle;
	this.ptsPerRow = Math.round(sideLen/this.pxPerPt);
}

Jiggley.prototype = {
	definePts: function() {

		var ptsPerBlock = 10;
		var pts = this.makeBlankGrid(this.ptsPerRow);
		var numBlocks = Math.ceil(ptsPerRow/ptsPerBlock);
		for (var blockIdxX=0; blockIdxX<numBlocks; blockIdxX++) {
			for (var blockIdxY=0; blockIdxY<numBlocks; blockIdxY++) {
				
				for (var xIdx=blockIdxX*ptsPerBlock; xIdx<ptsPerRow; xIdx++) {
					for (var yIdx=blockIdxY*ptsPerBlock; yIdx<ptsPerRow; yIdx++) {
						var pt = P(xIdx*this.pxPerPt, yIdx*this.pxPerPt);
						if (center.distSqrTo(pt) < this.rCircle) {
							pts[xIdx][yIdx] = pt;
						} else {
							pts[xIdx][yIdx] = undefined;
						}
					}
				}
				
			}
		}
		return pts;
	},
	defineTris: function(pts) {
		//Yo yo, I am trying a seed crystalish method.  Probably not fast, but kind of neat
		var linesDrawn = this.makeBlankGrid(this.ptsPerRow);
		this.populateWithNoLinesDraw(pts, linesDraw);
		var seed = getSeed(pts);
		//seed will be [{xIdx:, yIdx:}];
		//borderPtIdxs = seed
		while (true) {
			var borderPtIdxsLast = borderPtIdxs;
			var borderPtIdxs = [];
			
			
			if (borderPtIdxs.length==0) {
				break;
			}
		}
	
	},
	populateWithNoLinesDraw: function(pts, linesDrawn) {
		for (var x=0; x<linesDrawn.length; x++) {
			for (var y=0; y<linesDrawn[0].length; y++) {
				if (pts[x][y] != undefined) {
					linesDrawn[x][y] = {U:false, D:false, L:false, R:false, UL:false, UR:false, DL:false, DR:false};
				}
			
			}
		}	
	}
	makeBlankGrid: function(ptsPerRow) {
		var blankList = new Array(ptsPerRow);
		for (var ptIdx=0; ptIdx<ptsPerRow; ptIdx++) {
			blankList.push(new Array(ptsPerRow));
		}
		return blankList;
	}

}


function Triangle(a, b, c) {
	this.a = a;
	this.b = b;
	this.c = c;
	this.areaInit = this.area();
}

Triangle.prototype = {
	area: function() {
		var vAB = V(this.b.x-this.a.x, this.b.y-this.a.y);
		var vAC = V(this.c.x-this.a.x, this.c.y-this.a.y);
		var width = vAB.mag();
		var perpUV = V(-vAB.dy/width, vAB.dx/width);
		var height = vAC.dx*perpUV.dx + vAC.dy*perpUV.dy;
		return Math.abs(width*height/2);
		
	}
}