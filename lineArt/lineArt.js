function init() {
	var url = $('#imgUrl').val();
	img = new Image,
		src = url
	img.crossOrigin = 'Anonymous';

	
	img = new Image();
	img.onload = function() {
		var maxWidth = 900;
		var maxHeight = 800;
		if (img.width > maxWidth || img.height>maxHeight) {
			var heightOversize = img.height/maxHeight;
			var widthOversize = img.width/maxWidth;
			if (heightOversize > widthOversize) {
				img.height/=heightOversize;
				img.width/=heightOversize;
			} else {
				img.height/=widthOversize;
				img.width/=widthOversize;
			}
		}
		canvas.width = img.width;
		canvas.height = img.height;
		c.drawImage(img, 0, 0, img.width, img.height);	
		drawer = new Drawer (getImgColorData(img.width, img.height));
	
		console.log('done!');
	}
	img.src = url;
	
}

function Drawer(colorData) {
	var self = this;
	this.maxDs = .005;
	this.colorData = colorData;
	this.imgWidth = colorData.length;
	this.imgHeight = colorData[0].length;
	this.activeLines = [];
	this.linesPerTurn = 5;
	c.clearRect(0, 0, canvas.width, canvas.height);
	//this.pasteAllColData();
	window.setTimeout('drawer.turn()', 50);
	
	//remember to open AND close path
}

Drawer.prototype = {
	pasteAllColData: function() {
		for (var x=0; x<this.colorData.length; x++) {
			for (var y=0; y<this.colorData[0].length; y++) {
				c.beginPath();
				c.moveTo(x, y);
				var col = this.colorData[x][y];
				c.strokeStyle = 'rgba('+col.r+','+col.g+','+col.b+','+1+')';
				c.lineTo(x+1, y);
				c.stroke();
				c.closePath();
			}
		}
	},
	turn: function() {
		var self = this;
		this.activeLines = this.activeLines.concat(this.getNewPts());
		for (var lineIdx=this.activeLines.length-1; lineIdx>-1; lineIdx--) {
			var line = this.activeLines[lineIdx];
			c.beginPath();
			c.fillStyle = 'rgba('+line.col.r+','+line.col.g+','+line.col.b+','+line.col.a+')';
			var xo = line.x;
			var yo = line.y;
			line.x+=2*Math.cos(line.theta);
			line.y+=2*Math.sin(line.theta);
			c.rect(xo, yo, line.x-xo, line.y-yo);
			c.fill();
			c.closePath();
			line.theta+=line.dTheta;
			line.dTheta+=line.ddTheta;
			if (line.x>=this.imgWidth || line.x<0 || line.y>=this.imgHeight || line.y<0) {
				this.activeLines.splice(lineIdx, 1);
			} else {
				if (Math.abs(line.dTheta) > 1) {
					if (line.dTheta>0) {
						line.ddTheta = 48*(2*this.maxDs*(Math.random()-.8));
					} else {
						line.ddTheta = 48*(2*this.maxDs*(Math.random()-.2));
					}
					line.dTheta = 0;
					//line.ddTheta = 48*(2*this.maxDs*(Math.random()-1));
				}
				var curCol = this.colorData[Math.floor(line.x)][Math.floor(line.y)];
				var diff = Math.abs(line.col.r-curCol.r) + Math.abs(line.col.g-curCol.g) + Math.abs(line.col.b-curCol.b);
				
				line.col.a-=diff*line.colDiffSensitivity/765;
				line.col.a-=.0005;
				if (line.col.a<0) {
					this.activeLines.splice(lineIdx, 1);
				}
			}
		}
		window.setTimeout('drawer.turn()', 1);
	},
	getNewPts: function() {
		var newPts = [];
		for (var ptIdx=0; ptIdx<this.linesPerTurn; ptIdx++) {
			var x = Math.floor(Math.random()*this.imgWidth);
			var y = Math.floor(Math.random()*this.imgHeight);
			var col = this.colorData[x][y].copy();
			
			var theta = Math.random()*2*Math.PI;
			var dTheta = 20*this.maxDs*Math.random() - this.maxDs;
			if (dTheta>0) {
				var ddTheta = -24*(2*this.maxDs*Math.random());
			} else {
				var ddTheta = 24*(2*this.maxDs*Math.random());
			}
			var colDiffSensitivity = Math.random()*1.4 + .6;
			newPts.push(new Line(x, y, col, theta, dTheta, ddTheta, colDiffSensitivity));
		}
		return newPts;
	}
}



function getImgColorData(width, height) {
	var imgData = c.getImageData(0, 0, width, height).data;
	var colorData = makeBlankColorData(width, height);
	var blockLen = 50;
	for (var xBlockIdx=0; xBlockIdx<Math.ceil(width/blockLen); xBlockIdx++) {
		for (var yBlockIdx=0; yBlockIdx<Math.ceil(height/blockLen); yBlockIdx++) {
			var xMax = Math.min(width, (xBlockIdx+1)*blockLen);
			var yMax = Math.min(height, (yBlockIdx+1)*blockLen);
			
			for (var yIdx=blockLen*yBlockIdx; yIdx<yMax; yIdx++) {
				for (var xIdx=blockLen*xBlockIdx; xIdx<xMax; xIdx++) {
					var pxIdx = 4*(xIdx+yIdx*width);
					colorData[xIdx][yIdx] = C(imgData[pxIdx], imgData[pxIdx+1], imgData[pxIdx+2], 1);
				}
			}
		}
	}
	return colorData;
}

function makeBlankColorData(width, height) {
	var data = new Array(width);
	for (var xIdx=0; xIdx<width; xIdx++) {
		data[xIdx] = new Array(height);
	}
	return data;
}

function randomizeArray(array) {
	var arrayLen = array.length;
	var randomized = new Array(arrayLen);
	for (var idx=0; idx<arrayLen; idx++) {
		var grabIdx = Math.floor(Math.random()*array.length);
		randomized[idx] = array[grabIdx];
		array.splice(grabIdx, 1);
	}
	return randomized;
}

function Line(x, y, col, theta, dTheta, ddTheta, colDiffSensitivity) {
	this.x = x;
	this.y = y;
	this.col = col;
	this.col.a = Math.random();
	this.theta = theta;
	this.dTheta = dTheta;
	this.ddTheta = ddTheta;
	this.colDiffSensitivity = colDiffSensitivity;
	this.colDiffLast = 0;
	this.colDiff = 0;
}

function Color(r, g, b, a) {
	this.r = r;
	this.g = g;
	this.b = b;
	this.a = a;
}


Color.prototype = {
	copy: function() {
		return new Color(this.r, this.g, this.b, this.a);
	}
}

function C(r, g, b, a) {
	return new Color(r, g, b, a);
}
