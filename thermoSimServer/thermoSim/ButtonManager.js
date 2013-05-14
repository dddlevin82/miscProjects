/*
Copyright (C) 2013  Daniel Reid

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

function ButtonManager(wrapperDivId) {
	//optional
	this.wrapperDivId = wrapperDivId;

	this.groups = [];
	
}
//should add clean up with stuff
ButtonManager.prototype = {
	addGroup: function(handle, label, prefIdx, isRadio, isToggle) {
		var mgrWrapper = $('#' + this.wrapperDivId);
		var groupId = 'group' + handle;
		var wrapperId = groupId + 'Wrapper';
		var padderId = groupId + 'Padder';
		var groupButtonWrapperHTML = templater.div({attrs: {id: [groupId], class: ['buttonGroup']}});
		var wrapperInner = label + templater.br() + groupButtonWrapperHTML;
		var groupWrapperHTML = templater.div({attrs: {id: [wrapperId], handle: [handle], class: ['buttonManagerElem', 'displayText', 'buttonGroupWrapper']}, innerHTML: wrapperInner});
		var groupPadderHTML = templater.div({attrs: {id: [padderId], handle: [handle], class: ['buttonManagerElem', 'buttonGroupPadder']}, innerHTML: groupWrapperHTML});
		mgrWrapper.append(groupPadderHTML);
		this.groups.push(new ButtonManager.Group(mgrWrapper, groupId, handle, label, prefIdx, isRadio, isToggle));
	},
	removeGroup: function(groupHandle) {
		var group = this.getGroup(groupHandle);
		if (group) {
			var idx = this.groups.indexOf(group);
			var div = this.getGroupDiv(group);
			this.groups.splice(idx, 1);
			div.remove();
		} else {
			console.log('Bad group handle ' + groupHandle);
		}
	},
	removeButton: function(groupHandle, buttonHandle) {
		var group = this.getGroup(groupHandle);
		if (group) {
			group.removeButton(buttonHandle);
		} else {
			console.log('Bad group handle ' + groupHandle);
		}
	},
	getGroupDiv: function(group) {
		var children = $('#' + this.wrapperDivId).children();
		for (var i=0; i<children.length; i++) {
			if ($(children[i]).attr('handle') == group.handle) 
				return $(children[i]);
		}
	},
	arrangeGroupWrappers: function() {
		//all elements must be buttonManagerElems because I'm going to be treating the div pretty roughly.  Other stuff will be rearranged badly.
		var arrangement = this.arrangeObjs(this.groups);
		this.arrangeHTML($('#' + this.wrapperDivId), arrangement);
		
	},
	arrangeAllGroups: function() {
		for (var i=0; i<this.groups.length; i++) 
			this.arrangeGroup(this.groups[i].handle);
	},
	arrangeGroup: function(groupHandle) {
		var group = this.getGroup(groupHandle);
		
		if (group) {
			var arrangement = this.arrangeObjs(group.buttons);
			this.arrangeHTML($('#' + group.groupId), arrangement);
		} else {
			console.log('Bad group name ' + groupHandle);
		}
	},
	setButtonWidth: function() {
		var buttons = $('button.buttonManagerElem');
		var max = 100;
		for (var i=0; i<buttons.length; i++) {
			var button = buttons[i];
			max = Math.max(max, $(button).outerWidth());
		}
		for (var i=0; i<buttons.length; i++) {
			var button = buttons[i];
			$(button).css('width', max);
		}
	},

	arrangeHTML: function(parent, arrangement) {
		var divs = parent.children();
		var mustArrange = false;
		for (var i=0; i<divs.length; i++) {
			var div = divs[i];
			var arrangementItem = arrangement[i];
			var divHandle = $(div).attr('handle');
			mustArrange = Math.max(mustArrange, divHandle != arrangementItem.handle);
			if (mustArrange) break;
		}
		if (mustArrange) {
			var clones = {};
			for (var i=0; i<divs.length; i++) {
				var div = divs[i];
				clones[$(div).attr('handle')] = $(div).clone(true);
			}
			parent.html('');
			for (var arrIdx=0; arrIdx<arrangement.length; arrIdx++) {
				var arr = arrangement[arrIdx];
				var clone = clones[arr.handle];
				parent.append(clone);
			}
		}
	},
	addButton: function(groupHandle, handle, label, exprs, prefIdx, isDown) {
		//exprs can be string/func/array or {mouseDown: samestuff, mouseup: samestuff}
		var group = this.getGroup(groupHandle);
		if (group)
			group.addButton(handle, label, exprs, prefIdx, isDown);
		else
			console.log('Bad group handle ' + groupHandle); 
	},
	getGroup: function(groupHandle) {
		for (var i=0; i<this.groups.length; i++) 
			if (this.groups[i].handle == groupHandle) return this.groups[i];
	},
	arrangeObjs: function(unarranged) {
		var assignments = [];
		var sortedObjs = this.sortObjs(unarranged.concat());
		var assignedPrefs = this.slicePrefs(sortedObjs);
		var unassignedPrefs = this.sliceNoPrefs(sortedObjs);
		for (var i=0; i<assignedPrefs.length; i++) {
			var prefIdx = assignedPrefs[i].prefIdx;
			if (!assignments[prefIdx]) {
				assignments[prefIdx] = assignedPrefs[i];
			} else {
				assignments.push(assignedPrefs[i]);
			}
		}
		var idxSrc = 0;
		var idxDest = 0;
		while (idxSrc < unassignedPrefs.length) {
			if (assignments[idxDest] == undefined) {
				assignments[idxDest] = unassignedPrefs[idxSrc];
				idxSrc ++;
			}
			idxDest ++;
		}
		for (var i=assignments.length-1; i>=0; i--) {
			if (assignments[i] == undefined) {
				assignments.splice(i, 1);
			}
		}
		return assignments;
	},
	sortObjs: function(objs) {
		for (var i=0; i<objs.length; i++) {
			for (var j=0; j<objs.length - 1; j++) {
				if (objs[j].prefIdx > objs[j + 1].prefIdx || objs[j].prefIdx == undefined) {
					var a = objs[j];
					var b = objs[j + 1];
					objs[j] = b;
					objs[j + 1] = a;
				}
			}			
		}
		return objs;
		
	},
	slicePrefs: function(objs) {
		for (var i=0; i<objs.length; i++) {
			if (objs[i].prefIdx == undefined) {
				return objs.slice(0, i);
			}
		}
		return objs.slice(0, objs.length);
	},
	sliceNoPrefs: function(objs) {
		for (var i=0; i<objs.length; i++) {
			if (objs[i].prefIdx == undefined) {
				return objs.slice(i, objs.length);
			}
		}
		return [];
	}
	
}

ButtonManager.Group = function(mgrDiv, groupId, handle, label, prefIdx, isRadio, isToggle) {
	this.mgrDiv = mgrDiv;
	this.groupId = groupId;
	this.handle = handle;
	this.label = label;
	this.prefIdx = prefIdx;
	this.buttons = [];
	this.isRadio = isRadio;
	this.isToggle = isToggle && !isRadio;
}

ButtonManager.Group.prototype = {
	addButton: function(handle, label, exprs, prefIdx, isDown, cleanUpWith) {
		var buttonId = handle + 'Button';
		var wrapperId = handle + 'Wrapper';
		this.buttons.push(new ButtonManager.Button(handle, buttonId, wrapperId, label, exprs, prefIdx, cleanUpWith));
		var buttonHTML = templater.button({innerHTML: label, attrs: {id: [buttonId], class: ['buttonManagerElem', 'buttonManagerButton'], handle: [handle]}});
		var buttonWrapper = templater.div({innerHTML: buttonHTML, attrs: {id: [wrapperId], class:['buttonManagerElem', 'buttonWrapper'], handle: [handle]}});
		$('#' + this.groupId).append(buttonWrapper);
		var buttonJQ = $('button#' + buttonId);
		addJQueryElems(buttonJQ, 'button');
		var button = this.buttons[this.buttons.length - 1];
		var click = button.click;
		var mousedown = button.mousedown;
		var mouseup = button.mouseup;
		//hey - mouseup and mousedown only work for non-toggles and non-radios
		if (this.isRadio) {
			click = this.wrapInRadio(button, click);
		} else if (this.isToggle) {
			click = this.wrapInToggle(button, click);
		}
		if (isDown && click) {
			click();
		}
		if (isDown && this.isRadio) {
			this.pushRadio(button);
		} else if (isDown && this.isToggle) {
			this.toggleButton(button);
		}
		if (click) {
			$(buttonJQ).click(click);
		} 
		if (mousedown) {
			$(buttonJQ).mousedown(mousedown);
		}
		if (mouseup) {
			$(buttonJQ).mouseup(mouseup);
		}
	},
	removeButton: function(buttonHandle) {
		var button = this.getButton(buttonHandle);
		var div = this.getButtonDiv(button);
		div.remove();
		this.buttons.splice(this.buttons.indexOf(button), 1);		
	},
	wrapInRadio: function(clickedButton, cb) {
		var cbOld = cb;
		var self = this;
		cb = function() {
			self.pushRadio(clickedButton);
			cbOld();
		}
		return cb;
	},
	wrapInToggle: function(clickedButton, cb) {
		var cbOld = cb;
		var self = this;
		cb = function() {
			self.toggleButton(clickedButton);
			cbOld();
		}
		return cb;
	},
	pushRadio: function(clicked) {
		for (var i=0; i<this.buttons.length; i++) {
			var button = this.buttons[i];
			var JQElem = $('#' + button.buttonId);
			JQElem.removeClass('ui-button-as-radio-selected');
		}
		$('#' + clicked.buttonId).addClass('ui-button-as-radio-selected');	
	},
	toggleButton: function(clicked) {
		var JQElem = $('#' + clicked.buttonId);
		if (JQElem.hasClass('ui-button-as-radio-selected')) {
			JQElem.removeClass('ui-button-as-radio-selected');
		} else {
			JQElem.addClass('ui-button-as-radio-selected');
		}
	},
	getButton: function(handle) {
		for (var i=0; i<this.buttons.length; i++) {
			if (this.buttons[i].handle == handle) {
				return this.buttons[i];
			} 
		}
		console.log('Bad button handle ' + handle);
	},
	// cleanUp: function(type) {
		// for (var buttonIdx=this.buttons.length - 1; buttonIdx>=0; buttonIdx--) {
			// var button = this.buttons[buttonIdx];
			// if (button.cleanUpWith == type) {
				// this.removeButton(button.handle);
			// }
		// }
	// },
	getButtonDiv: function(button) {
		var children = $('#' + this.groupId).children();
		for (var i=0; i<children.length; i++) {
			if ($(children[i]).attr('handle') == button.handle) 
				return $(children[i]);
		}
	}
}

ButtonManager.Button = function(handle, buttonId, wrapperId, label, exprs, prefIdx, cleanUpWith) {
	this.handle = handle;
	this.buttonId = buttonId;
	this.wrapperId = wrapperId;
	this.label = label;
	this.click;
	this.mousedown;
	this.mouseup;
	if (exprs.mousedown || exprs.mouseup) {
		if (exprs.mousedown) {
			this.mousedown = this.wrapExprs(exprs.mousedown);
		}
		if (exprs.mouseup) {
			this.mouseup = this.wrapExprs(exprs.mouseup);
		}
	} else {
		this.click = this.wrapExprs(exprs)
	}

	this.prefIdx = prefIdx;
}

ButtonManager.Button.prototype = {
	wrapExprs: function(exprs) {
		if (typeof exprs == 'function') return exprs;
		var func, exprStr;
		if (exprs instanceof Array) {
			exprStr = exprs.join(';') + ';';
		} else {
			exprStr = exprs + ';';
		}
		with (DataGetFuncs) {
			func = eval('(function() {' + exprStr + '})');
		}
		return func;
	},


}

