/*
Copyright (C) 2013  Daniel Reid

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

function Listener(cb, ctx) {
	this.cb = cb;
	this.ctx = ctx;
}
function Point(x, y){
	this.x = x;
	this.y = y;
}
function Vector(dx, dy){
	this.dx = dx;
	this.dy = dy;
}
function Color(r, g, b){
	this.r = r;
	this.g = g;
	this.b = b;
	this.setHex();
}


function P(x, y){
	return new Point(x, y);
}
function V(dx, dy){
	return new Vector(dx, dy);
}
function Col(r, g, b){
	return new Color(r, g, b);
}


Vector.prototype = {
	UV: function(){
		var mag = Math.sqrt(this.dx*this.dx + this.dy*this.dy);
		return V(this.dx/mag, this.dy/mag);
	},
	mag: function(){
		return Math.sqrt(this.dx*this.dx + this.dy*this.dy);
	},
	add: function(b){
		this.dx+=b.dx;
		this.dy+=b.dy;
		return this;
	},
	sub: function(b) {
		this.dx-=b.dy;
		this.dy-=b.dx;
		return this;
	},
	set: function(b) {
		this.dx = b.dx;
		this.dy = b.dy;
	},
	neg: function(){
		this.dx*=-1;
		this.dy*=-1;
		return this;
	},
	dotProd: function(b){
		return this.dx*b.dx + this.dy*b.dy;
	},
	crossProd: function(b) {
		return this.dx * b.dy - this.dy * b.dx;
	},
	magSqr: function(){
		return this.dx*this.dx + this.dy*this.dy;
	},
	copy: function(){
		return new Vector(this.dx, this.dy);
	},
	mult: function(scalar){
		this.dx*=scalar; 
		this.dy*=scalar;
		return this;
	},
	multVec: function(b) {
		this.dx*=b.dx;
		this.dy*=b.dy;
		return this;
	},
	setMag: function(mag){
		this.mult(mag/this.mag());
		return this;
	},
	adjust: function(ddx, ddy){
		this.dx+=ddx;
		this.dy+=ddy;
		return this;
	},
	rotate: function(rad){
		var dx = this.dx, dy = this.dy, cos = Math.cos(rad), sin = Math.sin(rad);
		this.dx = dx * cos - dy * sin;
		this.dy = dx * sin + dy * cos;
		return this;
	},
	perp: function(dir){
		var dxOld = this.dx;
		var dyOld = this.dy;
		if (dir) {
			if (dir=='cw') {
				this.dx = dyOld;
				this.dy = -dxOld;
			} else { //dir is 'ccw'
				this.dx = -dyOld;
				this.dy = dxOld;
			}
		} else{ 
			this.dx = dyOld;
			this.dy = -dxOld;		
		}
		return this;
	},
	angle: function() {
		return Math.atan2(this.dy, this.dx);
	},
	sameAs: function(b){
		return (this.dx==b.dx && this.dy==b.dy);
	},
	isValid: function() {
		return this.dx!==undefined && !isNaN(this.dx) && this.dy!==undefined && !isNaN(this.dy);
	},
	zero: function() {
		this.x = 0;
		this.y = 0;
	},
}
Color.prototype = {
	adjust: function(dr, dg, db){
		this.r = Math.round(Math.min(255, Math.max(0, this.r+dr)));
		this.g = Math.round(Math.min(255, Math.max(0, this.g+dg)));
		this.b = Math.round(Math.min(255, Math.max(0, this.b+db)));
		this.setHex();
		return this;
	},
	set: function(col){
		if (col.r!==undefined) {this.r = col.r;};
		if (col.g!==undefined) {this.g = col.g;};
		if (col.b!==undefined) {this.b = col.b;};
		this.setHex();
		return this;
	},
	setFromUnround: function(col) {
		if(col.r!==undefined){this.r = Math.round(col.r);};
		if(col.g!==undefined){this.g = Math.round(col.g);};
		if(col.b!==undefined){this.b = Math.round(col.b);};
		this.setHex();
		return this;	
	},
	setHex: function(){
		var r = Number(Math.round(this.r)).toString(16);
		var g = Number(Math.round(this.g)).toString(16);
		var b = Number(Math.round(this.b)).toString(16);
		if (r.length==1) {r = '0'+r;}
		if (g.length==1) {g = '0'+g;}
		if (b.length==1) {b = '0'+b;}
		this.hex = '#' + r + g + b;
	},
	copy: function(){
		return new Color(this.r, this.g, this.b);
	},
	add: function(b){
		this.r = Math.round(Math.min(255, Math.max(0, this.r+b.r)));
		this.g = Math.round(Math.min(255, Math.max(0, this.g+b.g)));
		this.b = Math.round(Math.min(255, Math.max(0, this.b+b.b)));
		this.setHex();
		return this;	
	},
	addNoBounds: function(b){
		this.r = Math.round(this.r + b.r);
		this.g = Math.round(this.g + b.g);
		this.b = Math.round(this.b + b.b);
		this.setHex();
		return this;
	},
	mult: function(scalar){
		this.r = Math.round(Math.min(255, Math.max(0, this.r*scalar)));
		this.g = Math.round(Math.min(255, Math.max(0, this.g*scalar)));
		this.b = Math.round(Math.min(255, Math.max(0, this.b*scalar)));
		this.setHex();
		return this;
	},
	sameAs: function(b){
		return this.r == b.r && this.g == b.g && this.b == b.b;
	}

}
Point.prototype = {
	distTo: function(b) {
		var dx = this.x-b.x;
		var dy = this.y-b.y;
		return Math.sqrt(dx*dx + dy*dy);
	},
	distSqrTo: function(b) {
		var dx = this.x-b.x;
		var dy = this.y-b.y;
		return dx*dx + dy*dy;	
	},
	VTo: function(b) {
		return new Vector(b.x-this.x, b.y-this.y);
	},
	UVTo: function(b) {
		var mag = Math.sqrt((this.x - b.x) * (this.x - b.x) + (this.y - b.y) * (this.y - b.y));
		return new Vector((b.x - this.x) / mag, (b.y - this.y) / mag);
	},
	fracVTo: function(b, frac) {
		return this.VTo(b).mult(frac);
	},
	fracMoveTo: function(b, frac){
		this.movePt(this.fracVTo(b, frac));
		return this;
	},
	set: function(b) {
		this.x = b.x;
		this.y = b.y;
	},
	avg: function(b) {
		return new Point((this.x+b.x)/2, (this.y+b.y)/2);
	},
	area: function(a, b) {
		var baseV = V(a.x-this.x, a.y-this.y);
		var baseUV = baseV.UV();
		var width = baseV.mag();
		var basePerp = V(-baseUV.dy, baseUV.dx);
		var sideVec = V(b.x-this.x, b.y-this.y);
		var height = Math.abs(basePerp.dotProd(sideVec));
		return .5*width*height;
	},
	copy: function() {
		return new Point(this.x, this.y);
	},
	movePt: function(v) {
		if(v.dx!==undefined){
			this.x+=v.dx;
		}
		if(v.dy!==undefined){
			this.y+=v.dy;
		}
		//if(v.x!==undefined || v.y!==undefined){
		//	console.log('movePt TAKES A VECTOR, NOT A POINT!');
		//}
		return this;
	},
	moveInDir: function(mag, dir) {
		this.x += Math.cos(dir) * mag;
		this.y += Math.sin(dir) * mag;
		return this;
	},
	position: function(p){
		if(p.x!==undefined){
			this.x=p.x;
		}
		if(p.y!==undefined){
			this.y=p.y;
		}
		return this;
	},
	scale: function(around, val){
		var dx = this.x - around.x;
		var dy = this.y - around.y;
		this.x = around.x + dx*val;
		this.y = around.y + dy*val;
		return this;
	},
	rotate: function(around, rad){
		var origin = new Vector(around.x, around.y)
		this.movePt(origin.copy().neg());
		var x = this.x;
		var y = this.y;
		this.x = x*Math.cos(rad) - y*Math.sin(rad);
		this.y = x*Math.sin(rad) + y*Math.cos(rad);
		this.movePt(origin);
		return this;
	},
	mirror: function(around, vec){
		var UV = vec.UV();
		var ptVec = around.VTo(this);
		var perpVec = UV.perp('cw');
		var mag = ptVec.dotProd(perpVec);
		if (mag<0) {
			this.movePt(perpVec.mult(Math.abs(2*mag)));
		} else if (mag>0) {
			this.movePt(perpVec.neg().mult(2*mag));
		}
		return this;
		
	},
	rect: function(dims, dir){
		var pts = new Array(4);
		if (dir=='ccw') {
			pts[0] = this.copy();
			pts[1] = this.copy().movePt({dy:dims.dy});
			pts[2] = this.copy().movePt(dims);
			pts[3] = this.copy().movePt({dx:dims.dx});
		} else {
			pts[0] = this.copy();
			pts[1] = this.copy().movePt({dx:dims.dx});			
			pts[2] = this.copy().movePt(dims);
			pts[3] = this.copy().movePt({dy:dims.dy});
		}
		return pts;
	},
	roundedRect: function(dims, fracRnd, dir){
		var rectPts = this.rect(dims, dir);
		return this.roundPts(rectPts, fracRnd);
	},
	roundPts: function(pts, fracRnd){
		if(!this.sameAs(pts[0])){
			pts = [this].concat(pts);
		}
		var rndPts = new Array(2*(pts.length));
		pts['-1'] = pts[pts.length-1];
		pts.push(pts[0]);
		for (var ptIdx=0; ptIdx<pts.length-1; ptIdx++){
			rndPts[2*ptIdx] = pts[ptIdx].copy().fracMoveTo(pts[String(ptIdx-1)], fracRnd/2);
			rndPts[2*ptIdx+1] = pts[ptIdx].copy().fracMoveTo(pts[String(ptIdx+1)], fracRnd/2);
		}
		return rndPts;
	},
	sameAs: function(b) {
		return (this.x==b.x && this.y==b.y);
	},
	closeTo: function(b) {
		return Math.abs(this.x-b.x)<1 && Math.abs(this.y-b.y)<1;
	},
	isValid: function() {
		return this.x!==undefined && !isNaN(this.x) && this.y!==undefined && !isNaN(this.y);
	},
	track: function(trackData){
		var pt, offset, noTrackX, noTrackY, xMult, yMult;
		
		if (trackData instanceof Point) {
			pt = trackData;
			offset = V(0, 0);
			noTrackX = false;
			noTrackY = false;
			
			
			
		} else {
			pt = trackData.pt;
			offset = trackData.offset == undefined ? V(0, 0) : V(trackData.offset.dx || 0, trackData.offset.dy || 0);
			noTrackX = /x/i.test(trackData.noTrack);
			noTrackY = /y/i.test(trackData.noTrack);
		}
		xMult = !noTrackX ? 1 : 0;
		yMult = !noTrackY ? 1 : 0;
		var trackFunc = function() {
			this.x = this.x + xMult * (pt.x - this.x + offset.dx);
			this.y = this.y + yMult * (pt.y - this.y + offset.dy);
		}
		
		this.trackListenerId = unique(this.x+','+this.y+'tracksWithUniqueId', curLevel.updateListeners);
		
		addListener(curLevel, 'update', this.trackListenerId, trackFunc, this);
		if (!trackFunc) {
			console.log('tried to track ' + this.trackListenerId + " but input wasn't right");
			console.trace();
		}
		this.tracking = true;
		return this;
	},
	trackStop: function() {
		if (this.tracking) {
			removeListener(curLevel, 'update', this.trackListenerId);
			//removeListener(curLevel, this.cleanUpWith + 'CleanUp', this.trackListenerId);
			this.trackListenerId = undefined;
			//this.cleanUpWith = undefined;
			this.tracking = false;
		}
		return this;
	}
}
