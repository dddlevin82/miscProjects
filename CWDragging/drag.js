function Dragger() {
	this.framesClass = 'folder';
	this.init();
	this.selectedObj = undefined;
	this.animTime = 300;
	this.displaced = {up: undefined, down: undefined};
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
	displace: function(div, dir) {
		var dy;
		if (dir == 'up') {
			dy = -20;
		} else if (dir == 'down') {
			dy = 20;
		}
		var top = Number($(div).attr('baseTop')) + dy;

		$(div).animate({top: top}, this.animTime);
	},
	undisplace: function(div) {
		var baseTop = Number($(div).attr('baseTop'));
		$(div).animate({top: baseTop}, this.animTime);
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
			var inFrame;
			var curFrame;
			var displacedIdx;
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
				inFrame = dragMidPt > frameOffsetTop - 5 && dragMidPt < frameOffsetTop + frameHeight + 5;
				if (inFrame) {
					if (self.displaced.up) {
						self.undisplace(self.displaced.up);
						self.displaced.up = undefined;
					}
					if (self.displaced.down) {
						self.undisplace(self.displaced.down);
						self.displaced.down = undefined;
					}
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
						curFrame = self.frameObjs[curFrameIdx];
						displaceIdx = self.getDisplaceIdx(curFrame, dragElem);
						var oldDisplacedUp = self.displaced.up;
						var oldDisplacedDown = self.displaced.down;
						//return prev displaced ones first
						if (curFrame.dragElems[displaceIdx]) {
							self.displaced.down = curFrame.dragElems[displaceIdx].elem;
						} else {
							self.displaced.down = undefined;
						}
						if (curFrame.dragElems[displaceIdx - 1]) {
							self.displaced.up = curFrame.dragElems[displaceIdx-1].elem;
						} else {
							self.displaced.up = undefined;
						}
						
						if (oldDisplacedUp != self.displaced.up && oldDisplacedUp != self.displaced.down) {
							if (oldDisplacedUp)	self.undisplace(oldDisplacedUp);
													
						}
						if (oldDisplacedDown != self.displaced.down && oldDisplacedDown != self.displaced.up) {
							if (oldDisplacedDown) self.undisplace(oldDisplacedDown);
						}
						if (self.displaced.down != oldDisplacedDown) {
							self.displace(self.displaced.down, 'down');
						}
						if (self.displaced.up != oldDisplacedUp) {
							self.displace(self.displaced.up, 'up');
						}
						
					}
				}
				$(dragElem).css({left: curX, top: curY})
				
			}
			$(document).mousemove(moveFunc);
			var upFunc = function() {
				self.selectedObj = undefined;
				$(document).unbind('mousemove', moveFunc);
				$(document).unbind('mouseup', upFunc);
				if (inFrame || !curFrame) {
					frameObj.flyToPositions(function() {
						$(dragElem).css({'z-index': 0})
					});
					self.updateServer(frameObj);
				} else {
					$(dragElem).css({'z-index': 0})
					self.removeFromFrame(frameObj, dragElemObj)
					curFrame.dragElems.splice(displaceIdx || 0, 0, dragElemObj);
					self.reassembleHTML();
					self.init()
					self.updateServerFolderChange(frameObj, curFrame);
				}
			}
			$(document).mouseup(upFunc);
		})

	},
	removeFromFrame: function(frameObj, dragElemObj) {
		for (var elemIdx=0; elemIdx<frameObj.dragElems.length; elemIdx++) {
			if (dragElemObj == frameObj.dragElems[elemIdx]) {
				frameObj.dragElems.splice(elemIdx, 1);
				return
			}
		}
	},
	reassembleHTML: function() {
		var frameObjs = this.frameObjs;
		var newHTMLs = [];
		var objIds = [];
		for (var frameIdx=0; frameIdx<frameObjs.length; frameIdx++) {
			var frame = frameObjs[frameIdx];
			var frameObjIds = []
			var frameElem = frame.elem;
			var newHTML = '';
			for (var dragElemIdx=0; dragElemIdx<frame.dragElems.length; dragElemIdx++) {
				var dragElem = frame.dragElems[dragElemIdx].elem;
				frameObjIds.push($(dragElem).attr('id'));
				newHTML += dragElem[0].outerHTML;
			}
			newHTMLs.push(newHTML);
			objIds.push(frameObjIds);
		}
		
		for (var frameIdx=0; frameIdx<frameObjs.length; frameIdx++) {
			var frame = frameObjs[frameIdx];
			var frameElem = frame.elem;
			$(frameElem).html(newHTMLs[frameIdx]);
			var frameObjIds = objIds[frameIdx];
			for (var dragElemIdx=0; dragElemIdx<frame.dragElems.length; dragElemIdx++) {
				var dragElem = frame.dragElems[dragElemIdx].elem
				//need to set y values, otherwise they will be out of orfer after sorting
				$('#' + frameObjIds[dragElemIdx]).css({top: dragElemIdx});
			}
		}
		
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
	updateServerFolderChange: function(a, b) {
		//frameObj a and b
	},
	updateServer: function(frameObj) {
		var frameId = $(frameObj.elem).attr('id');
		var elemIds = [];
		for (var dragElemIdx=0; dragElemIdx<frameObj.dragElems.length; dragElemIdx++) {
			var dragElem = frameObj.dragElems[dragElemIdx].elem;
			elemIds.push($(dragElem).attr('id'));
			//this.serverSetPos(dragElem.selector, dragElemIdx);
			//alert('index->' + dragElemIdx + ' id->' + dragElem.selector);
		}
	},
	makeHttpObject3: function() {
		try {return new XMLHttpRequest();}
		catch (error) {}
		try {return new ActiveXObject("Msxml2.XMLHTTP");}
		catch (error) {}
		try {return new ActiveXObject("Microsoft.XMLHTTP");}
		catch (error) {}

		throw new Error("Could not create HTTP request object.");
	},
	serverSetPos: function(IdString, PosString) {
		try {
		
			//alert("CW.php?goto=manage_sets&popup=1&set_pos=1&conceptest_id=" + IdString + "&position_string=" + PosString);
		
			//changed to post and created redundant parameters because weird stuff happens with firefox and chrome...
			//	somehow popup and set_pos evaluate as true in the get, but the id and position are screwed up...
			var request = this.makeHttpObject3();
			request.open('POST', 'CW.php?goto=manage_sets&popup=1&set_pos=1&conceptest_id=' + IdString + '&position_string=' + PosString, false);
			request.setRequestHeader("Content-type","application/x-www-form-urlencoded");
			request.send('conceptest_id=' + IdString + '&position_string=' + PosString);
			
			//alert('yay ' + request.responseText + ' status->' + request.status);
		
		}
		catch (error) {}
	}
}

Dragger.prototype.Frame.prototype = {
	init: function() {
		var totalHeight = 0;
		var heights = [];
		this.ULOffset = {top: 0, left: 0};
		if (this.dragElems.length) {
			for (var elemIdx=0; elemIdx<this.dragElems.length; elemIdx++) {
				var elem = this.dragElems[elemIdx].elem;
				var height = $(elem).outerHeight();
				heights.push(height);
				totalHeight += height;
			}
			var curHeight = this.ULOffset.top;
			for (var elemIdx=0; elemIdx<this.dragElems.length; elemIdx++) {
				var elem = this.dragElems[elemIdx].elem;
				$(elem).css({position: 'absolute', top: curHeight, left: this.ULOffset.left});
				$(elem).attr('baseTop', $(elem).position().top);
				curHeight += heights[elemIdx];
			}
			$(this.elem).css({height: totalHeight});
			this.makeMasks();
			this.sortElems();
			this.assignElemIdxs();
		} else {
			$(this.elem).css({height: '', width: ''});
		}
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