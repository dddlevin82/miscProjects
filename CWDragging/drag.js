function Dragger() {
	this.framesClass = 'folder';
	this.init();
	this.selectedObj = undefined;
	this.animTime = 300;
}

Dragger.prototype = {
	init: function() {
		this.frameObjs = [];
		var frameDivs = $('div.' + this.framesClass);
		for (var frameIdx=0; frameIdx<frameDivs.length; frameIdx++) {
			this.frameObjs.push(new this.Frame(this, frameDivs[frameIdx]));
			var frameObj = this.frameObjs[this.frameObjs.length-1];
			var frameDiv = frameDivs[frameIdx];
			var dragElems = $(frameDiv).children();
			for (var dragElemIdx=0; dragElemIdx<dragElems.length; dragElemIdx++) {
				var dragElem = dragElems[dragElemIdx];
				var dragElemId = $(dragElem).attr('id');
				frameObj.addElem(new this.DragElem(this, $('#' + dragElemId), frameDiv)); 
			}
			frameObj.init();
			for (var dragElemIdx=0; dragElemIdx<dragElems.length; dragElemIdx++) {
				
				this.assignDrag(frameObj, frameObj.dragElems[dragElemIdx], frameObj.dragElems[dragElemIdx].elem);
			}
		}
	},
	assignDrag: function(frameObj, dragElemObj, dragElem) {
		var self = this;
		var dragMask = $('#' + $(dragElem).attr('id') + 'dragMask')[0];
		$(dragMask).mousedown(function(e) {
			var elemYs = frameObj.getElemYs();
			var elemHeights = frameObj.getElemHeights();
			$(dragElem).css({'z-index': 1})
			var mouseXo = e.pageX;
			var mouseYo = e.pageY;
			var dxLast = 0;
			var dyLast = 0;
			var offseto = $(dragElem).offset();
			var offsetXo = offseto.left;
			var offsetYo = offseto.top;
			self.selectedObj = dragElemObj;
			var moveFunc = function(e) {
				var dx = e.pageX - mouseXo;
				var dy = e.pageY - mouseYo;
				var curX = offsetXo + dx;
				var curY = offsetYo + dy;
				var oldIdx = dragElemObj.idx;
				var newIdx = undefined;
				
				for (var elemIdx=0; elemIdx<elemYs.length; elemIdx++) {
					var midPtY = elemYs[elemIdx] + elemHeights[elemIdx]/2;
					if (elemIdx < oldIdx) {
						if (curY <= midPtY) {
							var newIdx = elemIdx;
							break;
						}
					} else if (elemIdx > oldIdx) {
						if (curY + elemHeights[oldIdx] >= midPtY) {
							var newIdx = elemIdx;
							break;
						}
					}

				}
				
				if (newIdx !== undefined) {
					var movingSection = frameObj.dragElems[oldIdx];
					frameObj.dragElems.splice(oldIdx, 1);
					frameObj.dragElems.splice(newIdx, 0, movingSection);
					frameObj.assignIdxs();
					frameObj.flyToPositions();
				}
				
				$(dragElem).css({left: curX, top: curY})
				
			}
			$(window).mousemove(moveFunc);
			var upFunc = function() {
				self.selectedObj = undefined;
				$(window).unbind('mousemove', moveFunc);
				$(window).unbind('mouseup', upFunc);
				frameObj.flyToPositions(function() {
					$(dragElem).css({'z-index': 0})
				});
				self.updateServer(frameObj);
			}
			$(window).mouseup(upFunc);
		})

	},
	Frame: function(dragger, elem) {
		this.dragger = dragger;
		this.elem = elem;
		this.inited = false;
		this.dragElems = [];
		this.dragMasks = [];
	},
	DragElem: function(dragger, elem, id, parentDiv) {
		this.dragger = dragger;
		this.elem = elem;
		this.parentDiv = parentDiv;
		this.idx = undefined;
	},
	updateServer: function(frameObj) {
		var frameId = $(frameObj.elem).attr('id');
		var elemIds = [];
		for (var dragElemIdx=0; dragElemIdx<frameObj.dragElems.length; dragElemIdx++) {
			var dragElem = frameObj.dragElems[dragElemIdx].elem;
			elemIds.push($(dragElem).attr('id'));
		}
		console.log(frameId + '!' + elemIds.join('.'));
	}
}

Dragger.prototype.Frame.prototype = {
	init: function() {
		var totalHeight = 0;
		for (var elemIdx=0; elemIdx<this.dragElems.length; elemIdx++) {
			var elem = this.dragElems[elemIdx].elem;
			var offset = $(elem).offset();
			$(elem).css({top: offset.top, left: offset.left});
			totalHeight += $(elem).outerHeight();
		}

		for (var elemIdx=0; elemIdx<this.dragElems.length; elemIdx++) {
			var elem = this.dragElems[elemIdx].elem;
			$(elem).css({position: 'absolute'});
		}
		$(this.elem).css({height: totalHeight});
		this.makeMasks();
		this.sortElems();
		this.assignElemIdxs();
		this.ULOffset = this.getULOffset();
		this.inited = true;
	},
	makeMasks: function() {
		for (var elemIdx=0; elemIdx<this.dragElems.length; elemIdx++) {
			var elem = this.dragElems[elemIdx].elem;
			var id = $(elem).attr('id');
			var img = $('#' + id + 'dragImg');
			var pos = $(img).position();
			var width = document.getElementById(id + 'dragImg').naturalWidth;
			var height = document.getElementById(id + 'dragImg').naturalHeight;
			$(elem).append("<div id='" + id + "dragMask'></div");
			$('#' + id + 'dragMask').css({top: pos.top, left: pos.left, width: width, height: height, position: 'absolute', 'background-color': 'black', 'z-index': 1000, opacity: 0});
			this.dragMasks.push($('#' + id + 'dragMask'));
		}
	},
	getElemYs: function() {
		var ys = [];
		for (var elemIdx=0; elemIdx<this.dragElems.length; elemIdx++) {
			ys.push($(this.dragElems[elemIdx].elem).offset().top);
		}
		return ys;
	},
	getElemHeights: function() {
		var heights = [];
		for (var elemIdx=0; elemIdx<this.dragElems.length; elemIdx++) {
			heights.push($(this.dragElems[elemIdx].elem).outerHeight());
		}
		return heights;
	},
	sortElems: function() {
		var elems = this.dragElems;
		for (var i=0; i<elems.length; i++) {
			for (var j=0; j<elems.length-1; j++) {
				var a = elems[j].elem;
				var b = elems[j+1].elem;
				if ($(a).offset().top > $(b).offset().top) {
					elems[j] = b;
					elems[j+1] = a;
				}
			}
		}
	},
	assignElemIdxs: function() {
		var elems = this.dragElems;
		for (var i=0; i<elems.length; i++) {
			elems[i].idx = i;
		}
	},
	addElem: function(elem) {
		this.dragElems.push(elem);
	},
	assignIdxs: function() {
		for (var elemIdx=0; elemIdx<this.dragElems.length; elemIdx++) {
			this.dragElems[elemIdx].idx = elemIdx;
		}
	},
	getULOffset: function() {
		return $(this.dragElems[0].elem).offset();
	},
	flyToPositions: function(cb) {
		var ULOffset = this.ULOffset;
		var heights = this.getElemHeights();
		var newOffset = {top: ULOffset.top, left: ULOffset.left};
		for (var elemIdx=0; elemIdx<this.dragElems.length; elemIdx++) {
			var elem = this.dragElems[elemIdx];
			if (elem != this.dragger.selectedObj) {
				var offset = $(elem.elem).offset();
				if (offset.top != newOffset.top || offset.left != newOffset.left) {
					$(elem.elem).animate({top: newOffset.top, left: newOffset.left}, this.dragger.animTime, undefined, cb);
				}
			}
			newOffset.top += heights[elemIdx];
		}
	}
	
	

}

Dragger.prototype.DragElem.prototype = {

}
$(function() {
	dragger = new Dragger();
})