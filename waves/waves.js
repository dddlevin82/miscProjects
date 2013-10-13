function Waver(htmlElem, canvas, emittersAttrs) {
	this.updateInterval = 30;
	this.emitters = this.makeEmitters(emittersAttrs);
	this.canvas = canvas;
	this.time = 0;
	this.htmlElem = htmlElem;
	this.maxHeight = this.sumMags(this.emitters);
	var self = this;
	this.xx = this.htmlElem.width;
	this.yy = this.htmlElem.height;
	window.setInterval(function() {self.turn()}, this.updateInterval)
}

Waver.prototype = {
	makeEmitters: function(emittersAttrs) {
		var emtrs=  [];
		for (var i=0; i<emittersAttrs.length; i++) {
			var e = emittersAttrs[i];
			emtrs.push(new Waver.Emitter(e.pos, e.freq, e.mag));
		}
		return emtrs;
	},
	turn: function() {
		var maxHeight = 0;
		var emtrs = this.emitters;
		var pxlHeight = 0;
		var phaseAngle = 0;
		var time = this.time;
		var half = 256 * 3 / 2;
		var imgData = this.canvas.createImageData(this.xx, this.yy);
		for (var y=0, yy=this.yy; y<yy; y++) {
			for (var x=0, xx=this.xx; x<xx; x++) {
				var flr = 4 * (y * xx + x);
				pxlHeight = 0;
				for (var i=0; i<emtrs.length; i++) {
					var emtr = emtrs[i];
					var dist = Math.sqrt((emtr.pos.x - x) * (emtr.pos.x - x) + (emtr.pos.y - y) * (emtr.pos.y - y))
					phaseAngle = 2 * Math.PI * (this.time * emtr.freq - dist / emtr.waveLen);
					pxlHeight += emtr.mag * Math.sin(phaseAngle) / Math.max(dist, 1);
				}
				//half way is 0, 255/2, 255
				maxHeight = Math.max(Math.abs(pxlHeight), maxHeight);
				var colorNumber = half + half * pxlHeight / this.maxHeight;
				
				imgData.data[flr] = colorNumber;
				colorNumber -= 255;
				imgData.data[flr + 1] = colorNumber;
				colorNumber -= 255;
				imgData.data[flr + 2] = colorNumber;
				imgData.data[flr + 3] = 255;
			}
		}
		this.maxHeight = Math.max(this.maxHeight, maxHeight);
		console.log(this.maxHeight);
		this.canvas.putImageData(imgData, 0, 0);
		this.time += this.updateInterval / 1000;
		
	},
	sumMags: function(emtrs) {
		var x = 0 ;
		for (var i=0; i<emtrs.length; i++) x += emtrs[i].mag;
		return x;
	}
	
}

Waver.Emitter = function(pos, freq, mag) {  //freq in hz (ish)
	this.pos = pos;
	this.freq = freq;
	this.mag = mag;
	this.speed = 3 * Math.sqrt(mag);
	this.waveLen = this.speed / this.freq;
}