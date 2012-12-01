
function turn() {
	for (wormIdx=0; wormIdx<wormies.length; wormIdx++) {
		wormies[wormIdx].turn();
	}
}


function Wormy(canvasElement, drawCanvas, rSegment, mSegment, numSegments, fillCol) {
	this.cElement = canvasElement;
	this.c = drawCanvas;
	this.drawingTools = new DrawingTools(this.cElement, this.c);
	this.rSegment = rSegment;
	this.mSegment = mSegment;
	this.segments = this.makeSegments(numSegments);
	this.fillCol = fillCol;
}

Wormy.prototype = {
	makeSegments: function(numSegments) {
		var pos = P(this.cElement.width*Math.random(), this.cElement.height*Math.random());
		var dir = Math.random()*2*Math.PI;
		var UV = V(Math.cos(dir), Math.sin(dir));
		var segments = [];
		
		segments.push(new Segment(pos.copy(), this.rSegment, this.mSegment, this.fillCol.copy(), undefined, undefined, this.drawingTools));
		
		for (var segmentIdx=1; segmentIdx<numSegments; segmentIdx++) {
			pos.moveAlongUV(UV, dir);
			segments.push(new Segment (pos.copy(), this.rSegment, this.mSegment. this.fillCol.copy(), segments[segments.length-1], undefined, this.drawingTools));
			segments[segments.length-2].setNext(segments[segments.length-1]);
		}
		return segments;
	},
	draw: function() {
		for (var segmentIdx=0; segmentIdx<this.segments.length; segmentIdx++) {
			this.segments[segmentIdx].draw();
		}
	},
	turn: function() {
		this.shoveWithMouse();
		this.applyInternalForces();
	},
	shoveWithMouse: function() {
		for (var segmentIdx=0; segmentIdx<this.segments.length; segmentIdx++) {
			var mousePos = getLocalMousePos(this.cElement);
			var segment = this.segments[segmentIdx];
			var distSqr = (segment.pos.x-mousePos.x)*(segment.pos.x-mousePos.x) + (segment.pos.y-mousePos.y)*(segment.pos.y-mousePos.y);
			if (distSqr<segment.r*segment.r) {
				var mouseV = getMouseV();
				segment.v.dx += 2*mouseV.dx;
				segment.v.dy += 2*mouseV.dy;
			}
		}	
	},

}
function Segment(pos, r, m, fillCol, prev, next, drawingTools) {
	this.pos = pos;
	this.v = V(0, 0);
	this.r = r;
	this.m = m;
	this.fillCol = fillCol;
	this.drawingTools = drawingTools;
	
}

Segment.prototype = {
	setNext: function(next) {
		this.next = next;
	},
	setPrev: function(next) {
		this.prev = prev;
	},
	draw: function() {
		this.drawingTools.circle(this.pos, this.r, fillCol);
	}
}