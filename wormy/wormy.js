
function turn() {
	drawingTools.clear(Col(255,255,255));
	for (wormIdx=0; wormIdx<wormies.length; wormIdx++) {
		wormies[wormIdx].turn();
	}
	globalMousePosLast.x = globalMousePos.x;
	globalMousePosLast.y = globalMousePos.y;
}


function Wormy(canvasElement, drawCanvas, rSegment, mSegment, numSegments, fillCol) {
	this.cElement = canvasElement;
	this.twistScalar = 100;
	this.c = drawCanvas;
	this.drawingTools = new DrawingTools(this.cElement, this.c);
	this.rSegment = rSegment;
	this.mSegment = mSegment;
	this.fillCol = fillCol;
	this.segments = this.makeSegments(numSegments);
}

Wormy.prototype = {
	makeSegments: function(numSegments) {
		var pos = P(this.cElement.width*Math.random(), this.cElement.height*Math.random());
		var dir = Math.random()*2*Math.PI;
		var UV = V(Math.cos(dir), Math.sin(dir));
		var segments = [];
		
		segments.push(new Segment(pos.copy(), this.rSegment, this.mSegment, this.fillCol.copy(), undefined, undefined, this.drawingTools));
		
		for (var segmentIdx=1; segmentIdx<numSegments; segmentIdx++) {
			pos.moveAlongUV(UV, 2*this.rSegment);
			segments.push(new Segment (pos.copy(), this.rSegment, this.mSegment, this.fillCol.copy(), segments[segments.length-1], undefined, this.drawingTools));
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
		this.addInternalForces();
		this.applyForces();
		this.move();
		this.draw();
		
	},
	shoveWithMouse: function() {
		var mouseV = getMouseV();
		for (var segmentIdx=0; segmentIdx<this.segments.length; segmentIdx++) {
			var mousePos = getLocalMousePos(this.cElement);
			var segment = this.segments[segmentIdx];
			var distSqr = (segment.pos.x-mousePos.x)*(segment.pos.x-mousePos.x) + (segment.pos.y-mousePos.y)*(segment.pos.y-mousePos.y);
			if (distSqr<1.5*segment.r*segment.r) {
				
				segment.v.dx += 2*mouseV.dx;
				segment.v.dy += 2*mouseV.dy;
				//segment.pos.x += mouseV.dx;
				//segment.pos.y += mouseV.dy;
			}
		}	
	},
	addInternalForces: function() {
		this.addStretchingForces();
		this.addTwistingForces();
	},
	addStretchingForces: function() {
		for (var segmentIdx=0; segmentIdx<this.segments.length-1; segmentIdx++) {
			var cur = this.segments[segmentIdx];
			var next = this.segments[segmentIdx+1];
			var vToNext = cur.pos.VTo(next.pos);
			var dist = cur.pos.distTo(next.pos);
			var UV = V(vToNext.dx/dist, vToNext.dy/dist);
			var sumR = cur.r + next.r;
			var fMag = dist - sumR;
			var f = UV.mult(fMag);
			cur.f.add(f);
			next.f.add(f.neg());
		}
	},
	addTwistingForces: function() {
		
		for (var segmentIdx=1; segmentIdx<this.segments.length-1; segmentIdx++) {
			var prev = this.segments[segmentIdx-1];
			var cur = this.segments[segmentIdx];
			var next = this.segments[segmentIdx+1];
			var UVPrevToCur = prev.pos.VTo(cur.pos).UV();
			var UVCurToNext = cur.pos.VTo(next.pos).UV();
			var dotProd = UVPrevToCur.dotProd(UVCurToNext);
			var diff = Math.max(0, -dotProd + 1); // 0 to 2, 2 being most different; 
			diff*=this.twistScalar;
			//console.log(diff);
			diff = Math.pow(diff,1.1);
			var prevPerp = UVPrevToCur.copy().perp('cw');
			if (UVCurToNext.dotProd(prevPerp)>0) {
				var fDirNext = UVCurToNext.perp('ccw');
				var fDirPrev = UVPrevToCur.perp('ccw');

			} else {
				var fDirNext = UVCurToNext.perp('cw');
				var fDirPrev = UVPrevToCur.perp('cw');
			}
			var fPrev = fDirPrev.mult(diff);
			var fNext = fDirNext.mult(diff);
			var fCur = fNext.copy().add(fPrev).neg();
			prev.f.add(fPrev);
			cur.f.add(fCur);
			next.f.add(fNext);
		}
	},
	move: function() {
		for (var segmentIdx=0; segmentIdx<this.segments.length; segmentIdx++) {
			var segment = this.segments[segmentIdx];
			segment.pos.x += segment.v.dx;
			segment.pos.y += segment.v.dy;
			segment.v.mult(.9);//not physically correct, yo
		}
	},
	applyForces: function() {
		for (var segmentIdx=0; segmentIdx<this.segments.length; segmentIdx++) {
			var segment = this.segments[segmentIdx];
			segment.v.dx += segment.f.dx/segment.m;
			segment.v.dy += segment.f.dy/segment.m;//integrate time, yo
			segment.f.zero();
		}
	}

}
function Segment(pos, r, m, fillCol, prev, next, drawingTools) {
	this.pos = pos;
	this.v = V(0, 0);
	this.f = V(0, 0);
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
		this.drawingTools.circle(this.pos, this.r, this.fillCol);
	}
}