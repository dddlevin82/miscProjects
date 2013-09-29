function Bug(ctx, htmlElem, numDerivatives, lastDerivScalar, lastDerivCeil) {
	this.ctx = ctx;
	this.htmlElem = htmlElem;
	this.turn = 0;
	this.r = 2
	this.col = new Color(0, 0, 0);
	this.bias = P(0, 0)
	this.derivatives = this.makeDerivatives(numDerivatives, this.htmlElem);
	this.intervalId = this.begin(this.ctx, this.htmlElem, this.derivatives, this.bias, 5, lastDerivScalar, lastDerivCeil);
}

Bug.prototype = {
	makeDerivatives: function(numDerivatives, htmlElem) {
		var ds = [P(htmlElem.width / 2, htmlElem.height / 2)];
		for (var i=0; i<numDerivatives; i++) {
			ds.push(P(0, 0));
		}
		return ds;
	},
	begin: function(ctx, htmlElem, derivatives, bias, padding, lastDerivScalar, lastDerivCeil) {
		var self = this;
		return window.setInterval(function() {
			self.takeTurn(ctx, htmlElem, derivatives, bias, padding, lastDerivScalar, lastDerivCeil)
		}, 25);
	},
	takeTurn: function(ctx, htmlElem, derivatives, bias, padding, lastDerivScalar, lastDerivCeil) {
		this.draw(ctx, htmlElem, derivatives[0]);
		this.update(htmlElem, derivatives, bias, padding, lastDerivScalar, lastDerivCeil);
	},
	stop: function() {
		window.clearInterval(this.intervalId);
	},
	update: function(htmlElem, derivatives, bias, padding, lastDerivScalar, lastDerivCeil) {
		this.addDerivatives(derivatives);
		this.boundPosition(htmlElem, derivatives, padding);
		this.randLast(derivatives, bias, lastDerivScalar, lastDerivCeil);
	},
	boundPosition: function(htmlElem, derivatives, padding) {
		var x = padding;
		var y = padding;
		var xx = htmlElem.width - padding;
		var yy = htmlElem.height - padding;
		if (derivatives[0].x < x) {
			derivatives[0].x = Math.max(x, derivatives[0].x);
			if (derivatives[1]) {
				derivatives[1].x = setSign(derivatives[1].x, 1)
			}
		} else if (derivatives[0].x > xx) {
			derivatives[0].x = Math.min(xx, derivatives[0].x);
			if (derivatives[1]) {
				derivatives[1].x = setSign(derivatives[1].x, -1)
			}
		}

		if (derivatives[0].y < y) {
			derivatives[0].y = Math.max(y, derivatives[0].y);
			if (derivatives[1]) {
				derivatives[1].y = setSign(derivatives[1].y, 1)
			}
		} else if (derivatives[0].y > yy) {
			derivatives[0].y = Math.min(yy, derivatives[0].y);
			if (derivatives[1]) {
				derivatives[1].y = setSign(derivatives[1].y, -1)
			}
		}
		
	},
	randLast: function(ds, bias, scalar, ceil) {
		var d = ds[ds.length - 1];
		d.x += (Math.random() - .5) * scalar - Math.random() * setSign(Math.sqrt(Math.abs(bias.x)), bias.x) / fact(ds.length);
		d.y += (Math.random() - .5) * scalar / fact(ds.length);
		var dx = d.x;
		var dy = d.y;
		d.x = .99 * setSign(Math.min(Math.abs(d.x), ds.length > 1 ? ceil : Infinity), dx);
		d.y = .99 * setSign(Math.min(Math.abs(d.y), ds.length > 1 ? ceil : Infinity), dy);
		console.log(d.x.toPrecision(2) + ', ' + d.y.toPrecision(2));
	},
	addDerivatives: function(ds) {
		for (var i=0; i<ds.length - 1; i++) {
			ds[i].x += ds[i + 1].x;
			ds[i].y += ds[i + 1].y;
		}
	},
	draw: function(ctx, htmlElem, pos) {
		ctx.clearRect(0, 0, htmlElem.width, htmlElem.height);
		ctx.fillStyle = this.col.hex;
		ctx.beginPath();
		ctx.arc(pos.x, pos.y, this.r, 0, Math.PI*2, true);
		ctx.closePath();
		ctx.fill();			

	},
	
}

function fact(x) {
	for (var i = x - 1; i>1; i--) {
		x *= i;
	}
	return x;
}

function setSign(x, sign) {
	if (sign == 0) sign = 1;
	return Math.abs(x * sign) / sign;
}


function P(x, y) {
	return new Pair(x, y);
}

function Pair(x, y) {
	this.x = x;
	this.y = y;
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
		var r = Math.round(this.r).toString(16);
		var g = Math.round(this.g).toString(16);
		var b = Math.round(this.b).toString(16);
		if (r.length==1) {r = '0' + r;}
		if (g.length==1) {g = '0' + g;}
		if (b.length==1) {b = '0' + b;}
		this.hex = '#' + r + g + b;
	},	
}