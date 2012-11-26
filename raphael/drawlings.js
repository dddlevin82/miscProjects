var paper = Raphael(0, 0, 420, 400);

var r = paper.rect(0, 0, 100, 40, 5);
//r.attr('fill', '#f00');
//r.attr('stroke', '#fff');
//r.pos = P(0, 0);
var fillUnselect = '#64a0c1';
var fillSelect = '#526c7a';

rects = createRects(P(50, 50), 5);
rects.height = 40;
rects.pos = P(50, 50);
rects.num = 5;
rects.moveBlock = function(curIdx, newIdx) {
	if (newIdx!=curIdx) {
		var moving = this[curIdx];
		var toAnim = [];
		if (newIdx<curIdx) {
			for (var idx=curIdx-1; idx>=newIdx; idx--) {
				this[idx+1] = this[idx];
				this[idx+1].idx++;
				toAnim.push(this[idx+1]);
			}
		} else if (newIdx>curIdx) {
			for (var idx=curIdx; idx<newIdx; idx++) {
				this[idx] = this[idx+1];
				this[idx].idx--;
				toAnim.push(this[idx]);
			}
		} 
		this.flyToIdx(toAnim);
		this[newIdx] = moving;
		moving.idx = newIdx;
	}
}
rects.flyToIdx = function(toAnim) {
	for (var blockIdx=0; blockIdx<toAnim.length; blockIdx++) {
		var block = toAnim[blockIdx];
		block.snapToIdx();

	}
}
r.attr(
	{
		fill: fillUnselect,  
		stroke: '#3b4449',  
		'stroke-width': 5,  
		'stroke-linejoin': 'round',  
	}
)
//YO YO - gradient is relative to original position
function onStart() {
	//make like this.mouseInit.setTo(mousePos);
	this.toFront();
	this.mouseInit = mousePos.copy();
	this.posInit = P(this._.dx, this._.dy);
	this.attr({fill:fillSelect});
	console.log(this.posInit);
}

function onMove() {
	var x = (mousePos.x-this.mouseInit.x) + this.posInit.x;
	var y = (mousePos.y-this.mouseInit.y) + this.posInit.y;
	var idx = Math.min(rects.num-1, Math.max(0, Math.floor((y-rects.pos.y)/rects.height)));
	console.log(idx);
	if (idx != this.idx) {
		console.log(idx);
		rects.moveBlock(this.idx, idx);
	}
	this.transform('t' + x + ',' + y);
	
}

function onEnd() {
	this.mouseInit = undefined;
	this.posInit = undefined;
	this.attr({fill:fillUnselect});
	this.snapToIdx();
}


r.drag(onMove, onStart, onEnd);

function createRects(pos, numRects) {
	var width = 100;
	var height = 40;
	var y = pos.y;
	var rects = [];
	for (var rectIdx=0; rectIdx<numRects; rectIdx++) {
		var r = paper.rect(0, 0, width, height);
		r.transform('t' + pos.x + ',' + (y+1));
		y+=height;
		r.attr(
			{
				fill: fillUnselect,  
				stroke: '#3b4449',  
				'stroke-width': 5,  
				'stroke-linejoin': 'round',  
			}
		)
		r.snapToIdx = function() {
			var x = rects.pos.x;
			var y = this.idx*rects.height+rects.pos.y;
			this.animate({transform:'t' + x + ',' + y}, 250);		
		}
		r.drag(onMove, onStart, onEnd);
		r.idx = rectIdx;
		rects.push(r);
	}
	return rects;
}

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


