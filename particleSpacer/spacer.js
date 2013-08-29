function Spacer(ctx, htmlElem, numDots, r, padding, numTurns) {
	this.ctx = ctx;
	this.htmlElem = htmlElem;
	this.turn = 0;
	this.r = r;
	this.dots = this.makeDots(numDots, htmlElem, r, padding);
	this.intervalId = this.begin(this.ctx, this.htmlElem, this.dots, numTurns, padding);
}

Spacer.prototype = {
	begin: function(ctx, htmlElem, dots, numTurns, padding) {
		var self = this;
		return window.setInterval(function() {
			self.takeTurn(ctx, htmlElem, dots, numTurns, padding)
		}, 100);
	},
	takeTurn: function(ctx, htmlElem, dots, numTurns, padding) {
		this.draw(ctx, htmlElem, dots);
		if (this.turn++ == numTurns) {
			this.stop();
		} else {
			this.update(htmlElem, dots, padding);
		}
	},
	stop: function() {
		window.clearInterval(this.intervalId);
	},
	update: function(htmlElem, dots, padding) {
		var xGridDim = 20;
		var yGridDim = 20;
		var xGridSquares = Math.ceil(htmlElem.width / xGridDim);
		var yGridSquares = Math.ceil(htmlElem.height / yGridDim);
		
		this.repelDots(dots, this.makeGrid(xGridSquares, yGridSquares), xGridDim, yGridDim, htmlElem, padding);
		this.repelEdges(dots, htmlElem, padding);
		this.move(dots);
		this.damp(dots, .99);
	},
	makeGrid: function(x, y) {
		var grid = new Array(x)
		for (var i=0; i<x; i++) {
			var col = new Array(y)
			for (var j=0; j<y; j++) {
				col[j] = [];
			}
			grid[i] = col;
		}
		return grid;
	},
	move: function(dots) {
		for (var i=0, ii=dots.length; i<ii; i++) {
			dots[i].x += dots[i].v.dx;
			dots[i].y += dots[i].v.dy;
		}
	},
	damp: function(dots, coeff) {
		for (var i=0, ii=dots.length; i<ii; i++) {
			dots[i].v.dx *= coeff;
			dots[i].v.dy *= coeff;
		}
	},
	repelDots: function(dots, grid, dimX, dimY, htmlElem, padding) {
		for (var i=0, ii=dots.length; i<ii; i++) {
			var xSpan = grid.length - 1;
			var ySpan = grid[0].length - 1;
			var dot = dots[i];
			var gridX = Math.floor(dot.x / dimX);
			var gridY = Math.floor(dot.y / dimY);
			gridLoop:
				for (var x=Math.max(gridX-1, 0), xCeil=Math.min(gridX+1, xSpan)+1; x<xCeil; x++) {
					for (var y=Math.max(gridY-1, 0), yCeil=Math.min(gridY+1, ySpan)+1; y<yCeil; y++) {
						for (var neighborIdx=grid[x][y].length-1; neighborIdx>=0; neighborIdx--){
							var neighbor = grid[x][y][neighborIdx];
							var dx = dot.x-neighbor.x;
							var dy = dot.y-neighbor.y;
							var mag = Math.sqrt(dx * dx + dy * dy);
							var UVAB = V((neighbor.x-dot.x) / mag, (neighbor.y-dot.y) / mag);
							var dv = Math.min(.5, 1 / (mag * mag)); 
							neighbor.v.dx += UVAB.dx * dv;
							neighbor.v.dy += UVAB.dy * dv;
							dot.v.dx -= UVAB.dx * dv;
							dot.v.dy -= UVAB.dy * dv;

						}
					}
				}
			if (gridX>=0 && gridY>=0 && gridX<=xSpan && gridY<=ySpan) {
				grid[gridX][gridY].push(dot);
			} else {
				this.returnEscapist(dot, htmlElem, padding);
				console.log("dot out of bounds");		
			}
		}
	},
	returnEscapist: function(dot, htmlElem, padding) {
		var oldX = dot.x, oldY = dot.y;
		dot.x = Math.min(htmlElem.width - padding, Math.max(padding, dot.x));
		dot.y = Math.min(htmlElem.height - padding, Math.max(padding, dot.y));
		if (oldX != dot.x) dot.v.dx *= -1;
		if (oldY != dot.y) dot.v.dy *= -1;
	},
	repelEdges: function(dots, htmlElem, padding) {
		var x = .75 * padding;
		var xx = htmlElem.width - .75 * padding;
		var y = .75 * padding;
		var yy = htmlElem.height - .75 * padding;
		for (var i=0, ii=dots.length; i<ii; i++) {
			var dot = dots[i];
			this.applyEdgeForce(dot, dot.x - x,  'dx');
			this.applyEdgeForce(dot, dot.x - xx, 'dx');
			this.applyEdgeForce(dot, dot.y - y,  'dy');
			this.applyEdgeForce(dot, dot.y - yy, 'dy');
		}
	},
	applyEdgeForce: function(dot, dist, component) {
		var sign = Math.abs(dist) / dist;
		if (dist != 0) {
			dot.v[component] += sign * Math.min(.2, 1 / Math.pow(Math.abs(dist), 1.5));
		}
		
	},	
	draw: function(ctx, htmlElem, dots) {
		ctx.clearRect(0, 0, htmlElem.width, htmlElem.height);
		for (var i = 0; i<dots.length; i++) {
			ctx.fillStyle = dots[i].col.hex;
			ctx.beginPath();
			ctx.arc(dots[i].x, dots[i].y, dots[i].r, 0, Math.PI*2, true);
			ctx.closePath();
			ctx.fill();			
		}
	},
	makeDots: function(count, htmlElem, r, padding) {
		var dots = [];
		var width = htmlElem.width;
		var height = htmlElem.height;
		for (var i=0; i<count; i++) {
			dots.push(this.singleDot(0, 0, width, height, r, new Color(0, 255, 0), padding));
		}
		return dots;
	},
	singleDot: function(xo, yo, dx, dy, r, col, padding) {
		var x = xo + padding + Math.random() * (dx - 2 * padding);
		var y = yo + padding + Math.random() * (dy - 2 * padding);
		return new Spacer.Dot(x, y, r, col);
	}
	
}

Spacer.Dot = function(x, y, r, col) {
	this.x = x;
	this.y = y;
	this.r = r;
	this.col = col;
	this.v = V(0, 0)
}

function Vector(dx, dy) {
	this.dx = dx;
	this.dy = dy;
}

function V(dx, dy) {
	return new Vector(dx, dy);
}

function Color(r, g, b) {
	this.r = r;
	this.g = g;
	this.b = b;
	this.hex = this.setHex();
}

Color.prototype = {
	setHex: function() {
		var r = Number(Math.round(this.r)).toString(16);
		var g = Number(Math.round(this.g)).toString(16);
		var b = Number(Math.round(this.b)).toString(16);
		if (r.length==1) {r = '0'+r;}
		if (g.length==1) {g = '0'+g;}
		if (b.length==1) {b = '0'+b;}
		this.hex = '#' + r + g + b;
	},	
}