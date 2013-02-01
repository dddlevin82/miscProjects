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
			$(frameDiv).css('position', 'relative');
			var children = $(frameDiv).children();
			for (var childIdx=0; childIdx<children.length; childIdx++) {
				var child = children[childIdx];
				if ($(child).attr('class') == 'folderElem') {
					var dragElemId = $(child).attr('id');
					frameObj.addElem(new this.DragElem(this, $('#' + dragElemId), frameDiv)); 
				}
			}
			frameObj.init();
			var dragElems = frameObj.dragElems;
			
			for (var dragElemIdx=0; dragElemIdx<dragElems.length; dragElemIdx++) {
				
				this.assignDrag(frameObj, frameDiv, dragElems[dragElemIdx], dragElems[dragElemIdx].elem);
			}
		}
	},
	getFrameIdx: function(dragDiv) {
		for (var frameIdx=0; frameIdx<this.frameObjs.length; frameIdx++) {
			var frameDiv = this.frameObjs[frameIdx].elem;
			var dragHeight = $(dragDiv).outerHeight();
			var dragMidPt = $(dragDiv).offset().top + dragHeight/2;
			var frameTop = $(frameDiv).offset().top;
			var frameHeight = $(frameDiv).outerHeight();
			if (frameTop <= dragMidPt && frameTop + frameHeight >= dragMidPt) {
				return frameIdx;
			}
		}
		return undefined;
	},
	//will return the index it would fall to if released.  Divs on the index will be pushed up one
	getDisplaceIdx: function(frameObj, dragDiv) {
		var frameElems = frameObj.dragElems;
		var dragMidPt = $(dragDiv).offset().top + $(dragDiv).outerHeight()/2;
		for (var frameElemIdx=0; frameElemIdx<frameElems.length; frameElemIdx++) {
			var frameElem = frameElems[frameElemIdx].elem;
			var midPt = $(frameElem).offset().top + $(frameElem).outerHeight()/2;

			if (dragMidPt <= midPt) {
				return frameElemIdx;
			} else if (frameElemIdx == frameElems.length-1 && midPt >= $(frameElem).offset().top + $(frameElem).outerHeight()/2) {
				return frameElems.length;
			}
		}
	},
	assignDrag: function(frameObj, frameDiv, dragElemObj, dragElem) {
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
			var posO = $(dragElem).position();
			var posXo = posO.left;
			var posYo = posO.top;
			self.selectedObj = dragElemObj;
			var moveFunc = function(e) {
				var dx = e.pageX - mouseXo;
				var dy = e.pageY - mouseYo;
				var curX = posXo + dx;
				var curY = posYo + dy;
				var oldIdx = dragElemObj.idx;
				var newIdx = undefined;
				
				var frameOffsetTop = $(frameDiv).offset().top;
				var frameHeight = $(frameDiv).outerHeight();
				var dragHeight = $(dragElem).outerHeight();
				var dragMidPt = $(dragElem).offset().top + dragHeight/2;
				var inFrame = dragMidPt > frameOffsetTop - 5 && dragMidPt < frameOffsetTop + frameHeight + 5;
				if (inFrame) {
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
				} else {
					var curFrameIdx = self.getFrameIdx(dragElem);
					if (curFrameIdx !== undefined) {
						var frame = self.frameObjs[curFrameIdx];
						var displaceIdx = self.getDisplaceIdx(frame, dragElem);
						console.log(displaceIdx);
					}
				}
				$(dragElem).css({left: curX, top: curY})
				
			}
			$(document).mousemove(moveFunc);
			var upFunc = function() {
				self.selectedObj = undefined;
				$(document).unbind('mousemove', moveFunc);
				$(document).unbind('mouseup', upFunc);
				frameObj.flyToPositions(function() {
					$(dragElem).css({'z-index': 0})
				});
				self.updateServer(frameObj);
			}
			$(document).mouseup(upFunc);
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
		//console.log(frameId + '!' + elemIds.join('.'));
	}
}

Dragger.prototype.Frame.prototype = {
	init: function() {
		var totalHeight = 0;
		var poses = [];
		for (var elemIdx=0; elemIdx<this.dragElems.length; elemIdx++) {
			var elem = this.dragElems[elemIdx].elem;
			var pos = $(elem).position();
			poses.push(pos);
			totalHeight += $(elem).outerHeight();
		}

		for (var elemIdx=0; elemIdx<this.dragElems.length; elemIdx++) {
			var elem = this.dragElems[elemIdx].elem;
			var pos = poses[elemIdx];
			$(elem).css({position: 'absolute', top: pos.top, left: pos.left});
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
			var width = $('#' + id + 'dragImg').width();
			var height = $('#' + id + 'dragImg').height();
			$(elem).append("<div id='" + id + "dragMask'></div");
			$('#' + id + 'dragMask').css({top: pos.top, left: pos.left, width: width, height: height, position: 'absolute', 'z-index': 1000, 'background-color': 'black', opacity: 0});
			this.dragMasks.push($('#' + id + 'dragMask'));
		}
	},
	getElemYs: function() {
		var ys = [];
		for (var elemIdx=0; elemIdx<this.dragElems.length; elemIdx++) {
			ys.push($(this.dragElems[elemIdx].elem).position().top);
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
				if ($(a).position().top > $(b).position().top) {
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
		if (this.dragElems[0]) {
			return $(this.dragElems[0].elem).position();
		} else {
			return {top: 0, left: 0};
		}
	},
	flyToPositions: function(cb) {
		var ULOffset = this.ULOffset;
		var heights = this.getElemHeights();
		var newOffset = {top: ULOffset.top, left: ULOffset.left};
		for (var elemIdx=0; elemIdx<this.dragElems.length; elemIdx++) {
			var elem = this.dragElems[elemIdx];
			if (elem != this.dragger.selectedObj) {
				var pos = $(elem.elem).position();
				if (pos.top != newOffset.top || pos.left != newOffset.left) {
					$(elem.elem).animate({top: newOffset.top, left: newOffset.left}, this.dragger.animTime, undefined, cb);
				}
			}
			newOffset.top += heights[elemIdx];
		}
	}
	
	

}

Dragger.prototype.DragElem.prototype = {

}
$(window).load(function() {
	dragger = new Dragger();
})