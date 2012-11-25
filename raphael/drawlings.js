var paper = Raphael(10, 10, 420, 400);

var r = paper.rect(50, 50, 100, 40, 5);
//r.attr('fill', '#f00');
//r.attr('stroke', '#fff');
r.pos = P(0, 0);
r.attr(
	{
		gradient: '90-#526c7a-#64a0c1',  
		stroke: '#3b4449',  
		'stroke-width': 5,  
		'stroke-linejoin': 'round',  
	}
)

function onStart() {
	this.mouseInit = mousePos.copy();
}

function onMove() {
	var tx = mousePos.x - this.mouseInit.x + this.pos.x;
	var ty = mousePos.y - this.mouseInit.y + this.pos.y;
	this.transform('t' + tx + ',' + ty);
}

function onEnd() {
	this.pos.x += (mousePos.x - this.mouseInit.x);
	this.pos.y += (mousePos.y - this.mouseInit.y);
	this.mouseInit.x = 0;
	this.mouseInit.y = 0;
}


r.drag(onMove, onStart, onEnd);

/*
var tetronimo = paper.path("M 250 250 l 0 -50 l -50 0 l 0 -50 l -50 0 l 0 50 l -50 0 l 0 50 z");  
tetronimo.attr(
	{
		gradient: '90-#526c7a-#64a0c1',  
		stroke: '#3b4449',  
		'stroke-width': 10,  
		'stroke-linejoin': 'round',  
	}
)
tetronimo.animate({transform:'t0,100'}, 2000, 'bounce');
*/
/*'r-45,200,200'*/

var mousePos = P(0,0);
$(document).mousemove(function(e) {
	mousePos.x = e.pageX;
	mousePos.y = e.pageY;
})


