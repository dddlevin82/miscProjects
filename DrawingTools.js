function DrawingTools(canvasElement, drawCanvas){
	this.cElement = canvasElement;
	this.c = drawCanvas;
};

DrawingTools.prototype = {

	clear: function(col){
		var width = this.cElement.width;
		var height = this.cElement.height;
		this.c.clearRect(0, 0, width, height);
		this.c.fillStyle = col.hex;
		if (col !== undefined) {
			this.c.fillRect(0,0, width, height);
		}
	},
	circle: function(pos, r, fillCol) {
		this.c.fillStyle = fillCol.hex;
		this.c.beginPath();
		this.c.arc(pos.x, pos.y, r, 0, Math.PI*2, true)
		this.c.closePath();
		this.c.fill();
	},
	fillPts: function(pts, col){
		this.c.fillStyle = col.hex;
		this.c.beginPath();
		this.c.moveTo(pts[0].x, pts[0].y);
		for (var ptIdx=1; ptIdx<pts.length; ptIdx++){
			this.c.lineTo(pts[ptIdx].x, pts[ptIdx].y);
		}
		this.c.closePath();
		this.c.fill();
	},
	fillPtsAlpha: function(pts, col, alpha){
		var prevAlpha = this.c.globalAlpha;
		this.c.globalAlpha = alpha;
		draw.fillPts(pts, col, this.c);
		this.c.globalAlpha = prevAlpha;
	},
	fillPtsStroke: function(pts, fillCol, strokeCol){
		this.c.fillStyle = fillCol.hex
		this.c.strokeStyle = strokeCol.hex
		this.c.beginPath();
		this.c.moveTo(pts[0].x, pts[0].y);
		for (var ptIdx=1; ptIdx<pts.length; ptIdx++){
			this.c.lineTo(pts[ptIdx].x, pts[ptIdx].y);
		}
		this.c.closePath();
		this.c.stroke();
		this.c.fill();
	},
	roundedRect: function(pos, dims, r, col){
		var x = pos.x;
		var y = pos.y;
		var width = dims.dx;
		var height = dims.dy;
		this.c.fillStyle = col.hex
		this.c.beginPath();
		this.c.moveTo(x+r, y);
		this.curvedLine(P(x+width-r, y), P(x+width, y), P(x+width, y+r), this.c);
		this.curvedLine(P(x+width, y+height-r), P(x+width, y+height), P(x+width-r, y+height), this.c);
		this.curvedLine(P(x+r, y+height), P(x, y+height), P(x, y+height-r), this.c);
		this.curvedLine(P(x, y+r), P(x, y), P(x+r, y), this.c);
		this.c.closePath();
		this.c.fill();
		
	},
	fillRect: function(corner, dims, fillCol){
		this.c.fillStyle = fillCol.hex
		this.c.fillRect(corner.x, corner.y, dims.dx, dims.dy);
	},
	fillStrokeRect: function(corner, dims, fillCol, strokeCol){
		this.c.strokeStyle = strokeCol.hex;
		this.c.fillStyle = fillCol.hex;
		this.c.fillRect(corner.x, corner.y, dims.dx, dims.dy);
		this.c.strokeRect(corner.x, corner.y, dims.dx, dims.dy);
	},
	strokeRect: function(corner, dims, col){
		this.c.strokeStyle = col.hex;
		this.c.strokeRect(corner.x, corner.y, dims.dx, dims.dy);
	},

	line: function(p1, p2, col){
		this.c.strokeStyle = col.hex;
		this.c.beginPath();
		this.c.moveTo(p1.x, p1.y);
		this.c.lineTo(p2.x, p2.y);
		this.c.closePath();
		this.c.stroke();
	},
	curvedLine: function(line, curvePt, quadEnd){
		this.c.lineTo(line.x, line.y);
		this.c.quadraticCurveTo(curvePt.x, curvePt.y, quadEnd.x, quadEnd.y);
	},
	path: function(pts, col){
		this.c.strokeStyle = col.hex;
		this.c.beginPath();
		this.c.moveTo(pts[0].x, pts[0].y);
		for(var ptIdx=1; ptIdx<pts.length; ptIdx++){
			this.c.lineTo(pts[ptIdx].x, pts[ptIdx].y);
		}
		this.c.stroke();		
	},
	text: function(text, pos, font, col, align, rotation){
		this.c.save();
		this.c.translate(pos.x, pos.y);
		this.c.rotate(rotation);
		this.c.fillStyle = col.hex;
		this.c.font = font;
		this.c.textAlign = align;
		var fontSize = parseFloat(font);
		var yOffset = 0;
		var breakIdx = text.indexOf('\n');
		while (breakIdx!=-1){
			var toPrint = text.slice(0, breakIdx);
			this.c.fillText(toPrint, 0, yOffset);
			yOffset+=fontSize+2;
			text = text.slice(breakIdx+1, text.length);
			breakIdx = text.indexOf('\n');
		}
		this.c.fillText(text, 0, yOffset);
		this.c.restore();
	},

}

