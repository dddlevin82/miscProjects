//globals
updateInt = 75;
gabors = [];
gaborSrc = ['img1.png', 'img2.png', 'img3.png', 'img4.png', 'img5.png', 'img6.png', 'img7.png', 'img8.png', 'img9.png']
gaborIdx = 0;
//end


function Gabor(imgElem, opacityMax) {
	this.imgElem = imgElem;
	this.elemId = this.imgElem.attr('id');
	var self = this;
	this.imgElem.click(function(){self.click()});
	this.opacity = 0;
	this.opacityMax = opacityMax;
}

Gabor.prototype = {
	click: function() {
		gabors.splice(gabors.indexOf(this) , 1);
		
		$('#' + this.elemId).remove();
	}
}


function spawnNew() {
	var probCeil = Math.exp(-gabors.length * .2);
	if (Math.random() < probCeil) {
		var bodyElem = $('body');
		var width = bodyElem.width();
		var height = bodyElem.height();
		var rotation = Math.random() * 360;
		var opacityMax = .7 + .3 * Math.random();
		var x = .87 * width * Math.random() + .05 * width;
		var y = .87 * height * Math.random() + .05 * height;
		var imgId = 'img' + gaborIdx;
		gaborIdx++;
		var imgSrc = gaborSrc[Math.floor(Math.random() * gaborSrc.length)]
		var img = $("<img src = '" + imgSrc + "' id = '" + imgId + "' class = 'gabor' style = 'opacity:0'></img>");
		bodyElem.append(img);
		imgElem = $('#' + imgId);
		imgElem.rotate(rotation);
		gabor = new Gabor(imgElem, opacityMax)
		gabors.push(gabor);
	//	imgElem.click(function() {
	//		gabor.click();
	//	})
		imgElem.css('left', x + 'px');
		imgElem.css('top', y + 'px');
	}
}

function stepExisting() {
	for (var i=0; i<gabors.length; i++) {
		var gabor = gabors[i];
		var opacityCur = Number(gabor.imgElem.css('opacity'));
		opacityCur += .07 * gabor.opacityMax - opacityCur;
		gabor.imgElem.css('opacity', opacityCur);
	}
}


function turn() {
	spawnNew();
	stepExisting();
}



theInt = -1
$(document).ready(function() {
	theInt = window.setInterval(turn, updateInt)
})