$(function() {
	var canvas = document.getElementById('myCanvas');
	window.c = canvas.getContext('2d');
	window.canvasManager = new CanvasManager();
	window.gravity = 1;
	canvasManager.addCanvas('main', canvas, c, C(255, 255, 255));
	canvasManager.addListener('main', 'drawBall', cb, obj, 1) //oy - fill in
	window.ballHandler = new BallHandler();
	ballHandler.addBall(200, 300, 15, V(0, 0), Col(0, 0, 200))
	window.setInterval(turn, 30);
})