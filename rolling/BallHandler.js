function BallHandler() {
	this.balls = [];
}

BallHandler.prototype = {
	addBall: function(x, y, r, v, col) {
		this.balls.push(new BallHandler.Ball(x, y, r, v, col));
	}
}

BallHandler.Ball = function(x, y, r, v, col) {
	this.x = x;
	this.y = y;
	this.r = r;
	this.v = v;
	this.col = col;
}