'use strict';
angular.module('mean.workitems').factory('exportservice', function() {
	var exports = function(myscope, property) {
		this.result = "";
		this.exportToPlainText = function(workitem, level) {
			var exportResult = "";
			var bullit = "- ";
			var indentation = String.fromCharCode(32) + String.fromCharCode(32);
			var prefix = "";
			for (var i = 0; i < level; i++) {
				prefix += indentation;
			}

			var enter = String.fromCharCode(10); //9 is the charcode of enter

			//output subject
			//if hidden the completed, only display the new status
			if (myscope.displaydeleted || workitem.status == "new") {
				exportResult = workitem.subject + (workitem.status != "new" ? "[" + workitem.status + "]" : "") + enter;
				if (workitem.content && workitem.content.length > 0) {
					var lines = workitem.content.split(enter);
					for (var l = 0; l < lines.length; l++) {
						exportResult += prefix + lines[l] + enter;
					}
				}



				//for child items
				prefix += indentation;

				//if nodetype is node
				if (workitem.nodeType == "node") {
					//loop child node
					for (var i = 0; i < workitem.childItems.length; i++) {
						//if child is a node, and don't loaded, add a anchor [child_id]
						if (workitem.childItems[i].nodeType == "node") {
							exportResult += prefix + bullit + "[child_" + workitem.childItems[i]._id + "]";
						} else {
							//if hidden the completed, only display the new status
							if (myscope.displaydeleted || workitem.status == "new") {
								exportResult += prefix + bullit + workitem.childItems[i].subject + (workitem.childItems[i].status != "new" ? "[" + workitem.childItems[i].status + "]" : "") + enter;
								if (workitem.childItems[i].content && workitem.childItems[i].content.length > 0) {
									var lines = workitem.childItems[i].content.split(enter);
									for (var l = 0; l < lines.length; l++) {
										exportResult += prefix + lines[l] + enter;
									}

								}
							}
						}
					}
				}
			}

			//if scope.exportResult is empty, add node
			if (myscope[property] == "") {
				myscope[property] = exportResult;
			} else {
				//else find anchor in scope.exportResult, and replace the anchor with node

				if (exportResult == "") { // if exportResult is empty, that means we need to remove the anchor
					myscope[property] = myscope[property].replace(prefix + bullit + "[child_" + workitem._id + "]", exportResult);
				} else {
					myscope[property] = myscope[property].replace("[child_" + workitem._id + "]", exportResult);
				}

			}
		}

		this.exportToMarkDown = function(workitem, level) {
			var exportResult = "";
			var bullit = "- ";
			var headlevel = "#";
			var indentation = String.fromCharCode(9);
			var prefix = "";
			var contentLevel = 2; // to config which level is output as content

			for (var i = 0; i < level; i++) {
				prefix += headlevel;
			}

			if (level >= contentLevel) {
					prefix = "";
					for (var i = level - contentLevel; i > 0; i--) {
						prefix += indentation;
					}
					prefix += bullit;
				}

			var enter = String.fromCharCode(10); //9 is the charcode of enter

			//output subject
			//if hidden the completed, only display the new status
			if (myscope.displaydeleted || workitem.status == "new") {
				exportResult = workitem.subject + (workitem.status != "new" ? "[" + workitem.status + "]" : "") + enter;
				if (level == 0) {
					exportResult += "====" + enter;
				}
				if (workitem.content && workitem.content.length > 0) {
					exportResult += enter;
					var lines = workitem.content.split(enter);
					for (var l = 0; l < lines.length; l++) {
						exportResult += lines[l] + enter;
					}
					exportResult += enter;
				}


				//for child items
				prefix += headlevel;
				if (level >= contentLevel) {
					prefix = "";
					for (var i = level - contentLevel; i > 0; i--) {
						prefix += indentation;
					}
					prefix += bullit;
				}

				//if nodetype is node
				if (workitem.nodeType == "node") {
					//loop child node
					for (var i = 0; i < workitem.childItems.length; i++) {
						//if child is a node, and don't loaded, add a anchor [child_id]
						if (workitem.childItems[i].nodeType == "node") {
							exportResult += prefix + "[child_" + workitem.childItems[i]._id + "]";
						} else {
							//if hidden the completed, only display the new status
							if (myscope.displaydeleted || workitem.status == "new") {
								exportResult += prefix + workitem.childItems[i].subject + (workitem.childItems[i].status != "new" ? "[" + workitem.childItems[i].status + "]" : "") + enter;
								if (workitem.childItems[i].content && workitem.childItems[i].content.length > 0) {
									exportResult += enter;
									var lines = workitem.childItems[i].content.split(enter);
									for (var l = 0; l < lines.length; l++) {
										exportResult += prefix.replace(bullit, "") + lines[l] + enter;
									}
									exportResult += enter;
								}
							}
						}
					}
					exportResult += enter;
				}

			}
			//if scope.exportResult is empty, add node
			if (myscope[property] == "") {
				myscope[property] = exportResult;
			} else {
				//else find anchor in scope.exportResult, and replace the anchor with node
				if (exportResult == "") { // if exportResult is empty, that means we need to remove the anchor
					myscope[property] = myscope[property].replace(bullit + "[child_" + workitem._id + "]", enter);
				} else {
					myscope[property] = myscope[property].replace("[child_" + workitem._id + "]", exportResult);
				}
			}
		}
	}
	return exports;

});