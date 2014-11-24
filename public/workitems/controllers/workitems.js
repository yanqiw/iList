'use strict';
//console.log('public/workitems/controller/workitems.js');
angular.module('mean.workitems').controller('WorkitemsController', ['$scope', '$stateParams', '$location', 'Global', '$rootScope', '$sce',
    'workitemREST', 'Mhotkeys', 'decorator','exportservice',
    function($scope, $stateParams, $location, Global, $rootScope, $sce, workitemREST, Mhotkeys, decorator,exportservice) {
        $scope.global = Global;

        // below two line need to be changed
        $scope.global.user = window.user
        $scope.global.authenticated = !!window.user


        //toggle flag
        $scope.displaydeleted = false;
        $scope.editable = true;

        //clipboard for cut, past
        $scope.clipboard = null; //null is empty

        //mouseover node
        $scope.mouseover = null; //null is empty

        //export node
        $scope.exportNode = null;
        //save the export code
        $scope.exportResult = 'none';

        //status
        $scope.saveStatus = "Saved";
		
		$scope.exportT = new exportservice($scope,"exportResult");

        //hotkey handler  begin
        $scope.mhotkeys = Mhotkeys;

        var workitemShiftTab = function(workitem) {
            workitem.subject = window.document.getElementById("subject_" + workitem._id).innerHTML;
            $scope.moveToParent(workitem);
            workitem.focusInput = true;
        };
        var workitemTab = function(workitem) {
            workitem.subject = window.document.getElementById("subject_" + workitem._id).innerHTML;
            $scope.moveToChild(workitem);
            workitem.focusInput = true;

        }
        var workitemEnter = function(workitem) {
            workitem.subject = window.document.getElementById("subject_" + workitem._id).innerHTML;
            // if has child, and open, should create child work item, need to add this later                        
            if (workitem.childItems && workitem.childItems.length > 0 && workitem.expand) {
                $scope.createChild(workitem);
            } else {
                $scope.create(workitem);
            }

            $scope.update(workitem);
        }

        var workitemUp = function(workitem) {
            var preBrother = _getPreWI(workitem);
            preBrother.focusInput = true;
        }

        var workitemDown = function(workitem) {
            var subBrother = _getNextWI(workitem, true);
            subBrother.focusInput = true;
        }
		
		var workitemCtrS = function(workitem) {
            $scope.update(workitem);
			workitem.focusInput = true;
        }

        var workitemDel = function(workitem) {
            $scope.changeStatus(workitem, 'deleted');
            workitem.focusInput = false;
        }

		var g_toggleDeleted=function(){
		   $scope.toggleDeleted();
		}
		//var $scope.toggleDeleted
        $scope.mhotkeys.add({
            "shift+tab": workitemShiftTab,
            "tab": workitemTab,
            "enter": workitemEnter,
            "up": workitemUp,
            "down": workitemDown,
			"ctrl+S": workitemCtrS,
			"ctrl+D": workitemDel,
			"ctrl+shift+S":g_toggleDeleted
        });
		
		
		window.onkeydown=function(event,workItem){	
		  $scope.mhotkeys.triger(null, event);
		  $scope.$apply();
		}
        //hotkey handler  end 

        // Tags query
        window.query = function(text) {
            text = $scope.decorator._removeHtml(text);
            var f = $("#query").val(); // current filter
            if (!~f.indexOf(text)) { // if the tag not in the filter
                text = f + text;
            } else {
                text = f.split(text).join(""); //remove the tag from filters
            }
            $scope.query = text;
            $scope.$apply();
            return false;
        }

        // Decorator start

        $scope.decorator = new decorator();

        // Decorator end

        //workItem actions start

        $scope.create = function(workitem) {
            var wi = new workitemREST({
                subject: this.subject,
                content: this.content
            });

            if (workitem) {
                wi.parent = workitem.parent;
            } else {
                wi.parent = $scope.root._id;
            }

            if (workitem.index) {
                wi.index = Number(workitem.index) + 1;
            } else {
                wi.index = 0;
            }

            var parentNode = _getWIInScope(wi.parent);
            var childItems = parentNode.childItems;

            //append new node
            if (workitem) {
                if (workitem.index) {
                    parentNode.childItems.splice(Number(workitem.index) + 1, 0, wi);
                } else {
                    for (var i in childItems) {
                        if (childItems[i]._id === workitem._id) {
                            parentNode.childItems.splice(Number(i) + 1, 0, wi);
                        }
                    }
                }
            } else {
                parentNode.childItems.unshift(wi);
            }

            wi.focusInput = true;

            // update index
            for (var j = wi.index + 1; j < childItems.length; j++) {
                childItems[j].index = j;
                $scope.update(childItems[j]); // can this handle by server side?
            }

            _savingStatus();

            wi.$save(function(response) {
                _savedStatus();
            });

            this.subject = '';
            this.content = '';
        };

        $scope.createChild = function(workitem, side) {
            var wi = new workitemREST({
                subject: this.subject,
                content: this.content
            });
            if (workitem) {
                wi.parent = workitem._id;
            } else {
                return false;
            }

            if (!workitem.childItems) {
                workitem.childItems = [];
            }

            if (side && side === "end") {
                wi.index = workitem.childItems.length;
            } else {
                wi.index = 0;
            }

            wi.focusInput = true;
            if (side && side === "end") {
                workitem.childItems.push(wi);
            } else {
                workitem.childItems.unshift(wi);
                workitem.nodeType = 'node';
                workitem.expand = true;
                for (var i = 1; i < workitem.childItems.length; i++) {
                    workitem.childItems[i].index = i;
                    //$scope.update(workitem.childItems[i]); // can this handle by server side?
                }
            }

            _savingStatus();

            wi.$save(function(response) {
                _savedStatus();
            });

            this.subject = '';
            this.content = '';
        };

        $scope.remove = function(workitem) {
            if (workitem) {
                var parentNode = _getWIInScope(workitem.parent);
                //console.log('parentNode');
                //console.log(parentNode);

                //This should be changed, to delete the item in the borwser, not find again
                var ItemArray = [];
                var update = false;
                //console.log(parentNode);
                if (parentNode) {
                    ItemArray = parentNode.childItems;
                }
                for (var i in ItemArray) {
                    if (ItemArray[i] === workitem) {
                        ItemArray.splice(i, 1);
                        update = true;
                    }
                    if (update && ItemArray[i] && ItemArray[i]._id) {
                        ItemArray[i].index = Number(i);
                        $scope.update(ItemArray[i]); // can this handle by server side?
                    }

                }
                //$scope.find();
                _savingStatus();
                workitem.$remove(function(response) {
                    _savedStatus();
                });
            } else {
                $scope.workitem.$remove(function(response) {
                    $location.path('workitems')
                });
            }
        };

        $scope.editSubject = function(workitem, event) {

            $scope.mhotkeys.triger(workitem, event);
            if (event.type == 'blur') {
                workitem.subject = window.document.getElementById("subject_" + workitem._id).innerHTML;
                $scope.update(workitem);
                event.preventDefault();

            }

        }
        $scope.editContent = function(workitem, event) {
            // replace the html to \n, this should be a single fundtion
            var content;
            content = angular.element(window.document.getElementById("content_" + workitem._id)).html();
            content = content.replace(/\<div\>/g, "\n");
            content = content.replace(/\<\/div\>/g, "");
            angular.element(window.document.getElementById("content_" + workitem._id)).html(content);
            // end of the replace
            workitem.content = content;
            $scope.update(workitem);

        }

        $scope.changeStatus = function(workitem, status) {
            if (workitem) {
                var wi = workitem;
            } else {
                var wi = $scope.workitem;
            }


            wi.status = status;
            wi.updated = new Date().getTime();

            var childItems = workitem.childItems;
            wi.$update(function(workitem) {
                if (workitem) {
                    workitem.childItems = childItems;
                } else {
                    //$location.path('workitems/' + workitem._id);
                }

            });
        };

        $scope.update = function(workItem, callback) {
            var wi;
            if (workItem) {
                wi = workItem;
            } else {
                wi = $scope.workItem;
            }



            wi.updated = new Date();

            wi.subject = $scope.decorator._removeHtml(wi.subject);

            var childItems = workItem.childItems;
            _savingStatus();
            wi.$update(function(response) {
                _savedStatus();
                if (response) {
                    response.childItems = childItems;
                    if (callback) {
                        callback(response);
                    }
                } else {
                    $location.path('workitems/' + response._id);
                }
            });
        };

        $scope.getRoot = function() {
            if ($stateParams.workitemId) {
                workitemREST.get({
                    workitemId: $stateParams.workitemId
                }, function(root) {
                    $scope.root = root;
                    $scope.findChild(root);
                });
            } else {
                workitemREST.root.get(function(root) {
                    //console.log(root);
                    $scope.root = root;
                    $scope.findChild(root);
                });
            }

        };

        $scope.find = function() {
            workitemREST.query(function(workitems) {
                $scope.workitems = workitems;
            });
        };

        $scope.findOne = function(workItem) {
            var workitemId = '';
            if (workItem) {
                //for find detail in the list
                workitemId = workItem._id;
            } else {
                workitemId = $stateParams.workitemId;
            }
            workitemREST.get({
                workitemId: workitemId
            }, function(wi) {
                //console.log(wi);
                if (workItem) {
                    workItem = wi;
                } else {
                    $scope.workItem = wi;
                }

            });
        };

        //Add the child return with the detail. 
        $scope.findChild = function(workItem, forceLoad, callback) {
            var workitemId = "";
            if (
                (workItem && !workItem.childItems && workItem.nodeType == "node" && workItem.expand && ($scope.displaydeleted || workItem.status != "deleted")) || $scope.root._id == workItem._id || forceLoad) {
                workitemId = workItem._id;
            } else {
                return;
            }

            workitemREST.childItems.get({
                workitemId: workitemId
            }, function(wi) {
                //console.log("findChild");
                workItem.childItems = wi;

                if (callback) {
                    callback(wi);
                }
            });
        };

        //work on all sub the children.
        $scope.workOnChildren = function(workItem, forceLoad, level, callback) {
            if (workItem.nodeType == "leaf") {
                if (callback) {
                    callback(workItem, level);
                }
            } else {
                if (workItem.childItems) {
                    if (callback) {
                        callback(workItem, level);
                    }
                    for (var i = 0; i < workItem.childItems.length; i++) {
                        $scope.workOnChildren(workItem.childItems[i], forceLoad, level + 1, callback);
                    }
                } else {
                    $scope.findChild(workItem, forceLoad, function(childItems) {
                        if (callback) {
                            callback(workItem, level);
                        }
                        //loop child node
                        for (var i = 0; i < childItems.length; i++) {
                            //transport to self
                            $scope.workOnChildren(childItems[i], forceLoad, level + 1, callback)
                        }
                    });
                }

            }
        }

        //is the child of a node
        $scope.isChild = function(currentWI, parentWI) {
            return _getWIInScope(currentWI._id, parentWI) ? false : true;
        }

        $scope.cut = function(workItem) {
            $scope.clipboard = workItem;
            $scope.toggleToolBar(workItem);

        }

        $scope.paste = function(targetWI, toChild) {
            if (!$scope.clipboard) return;
            $scope.moveTo($scope.clipboard, targetWI, toChild);

            //$scope.toggleToolBar(targetWI);

            //clean clipboard
            $scope.clipboard = null;
        }

        $scope.cleanClipboard = function() {
            $scope.clipboard = null;
        }

        //workItem actions end

        //move workItem start
        //move a workitem after target workitem, if the toChild is true. move to the first child of target workitem
        $scope.moveTo = function(workitem, targetWI, toChild) {
            if (!workitem || !workitem.parent || !targetWI) return;

            // can't move the parent to its child.
            // here has a bug, is that if the targetWI is the sub of sub of the workitem self, the bug happen
            // as you never can move a parent to his child, this need to be fixed after add Breadcrumbs array
            // by Breadcrumbs, we can check the parent chain
            if (targetWI.parent == workitem._id) return;

            //get parent
            var parentNode = _getWIInScope(workitem.parent);
            var brothers = parentNode.childItems;
            var showToolBar = workitem.showToolBar;
            var oldi = workitem.index;

            //remove workitem from old childlist
            brothers.splice(oldi, 1);
            for (oldi = oldi; oldi < brothers.length; oldi++) {
                if (brothers[oldi]._id) {
                    brothers[oldi].index = Number(oldi);
                };
            }

            //if move to child
            if (toChild) {
                //change the parent to targetWI and index 
                workitem.parent = targetWI._id;
                workitem.index = 0;
                if (!targetWI.childItems) {
                    targetWI.childItems = [];
                }
                targetWI.expand = true;
                if (targetWI.nodeType == "leaf") {
                    targetWI.nodeType = "node";
                }
                targetWI.childItems.unshift(workitem);

                $scope.update(workitem, function(wi) {
                    wi.showToolBar = showToolBar
                });


                //update targetWI's childlist index
                for (var i = 1; i < targetWI.childItems.length; i++) {
                    targetWI.childItems[i].index = i;
                    //$scope.update(targetWI.childItems[i]); // can this handle by server side?
                }

            } else {
                //move to sub brother
                //find new parent
                var newParentWI = _getWIInScope(targetWI.parent);
                var newBorthers = newParentWI.childItems
                workitem.parent = newParentWI._id;
                workitem.index = targetWI.index + 1;

                $scope.update(workitem, function(wi) {
                    wi.showToolBar = showToolBar
                });
                newBorthers.splice(workitem.index, 0, workitem);
                //update targetWI's childlist index
                for (var i = workitem.index + 1; i < newParentWI.childItems.length; i++) {
                    newParentWI.childItems[i].index = i;
                    //$scope.update(newParentWI.childItems[i]); // can this handle by server side?
                }

            }



        }

        $scope.moveToChild = function(workitem) {
            if (!workitem || !workitem.parent) return;

            var parentNode = _getWIInScope(workitem.parent);
            var brothers = parentNode.childItems;
            var prebrother = _getPreBrotherWI(workitem);
            var showToolBar = workitem.showToolBar;

            // if the node is the first child of the parent node, the move to sub should be canceled
            if (prebrother == parentNode) return;

            //change the parent and index 
            workitem.parent = prebrother._id;
            workitem.index = prebrother.childItems ? prebrother.childItems.length : 0;
            if (!prebrother.childItems) {
                prebrother.childItems = [];
            }
            prebrother.childItems.push(workitem);
            prebrother.expand = true;
            if (prebrother.nodeType == "leaf") {
                prebrother.nodeType = "node";
            }
            $scope.update(workitem, function(wi) {
                wi.showToolBar = showToolBar
            });

            var i = 0;
            for (i; i < brothers.length; i++) {
                if (brothers[i] === workitem) {
                    break;
                }
            }

            brothers.splice(i, 1);
            for (i = i - 1; i < brothers.length; i++) {
                if (brothers[i]._id) {
                    brothers[i].index = Number(i);
                };
            }

        }

        $scope.moveToParent = function(workitem) {
            if (!workitem || !workitem.parent || workitem.parent == $scope.root._id) return;

            var brother = _getWIInScope(workitem.parent);
            var parentNode = _getWIInScope(brother.parent);
            var brothers = parentNode.childItems;
            var oldi = workitem.index;

            var showToolBar = workitem.showToolBar;

            brother.childItems.splice(oldi, 1);

            var i = brother.index;
            workitem.parent = brother.parent;
            workitem.index = Number(i) + 1;

            brothers.splice(i + 1, 0, workitem);
            if (brother.childItems.length == 0) {
                brother.nodeType = "leaf";
            }

            $scope.update(workitem, function(wi) {
                wi.showToolBar = showToolBar
            });

            for (oldi; oldi < brother.childItems.length; oldi++) {
                if (brother.childItems[oldi]._id) {
                    brother.childItems[oldi].index = Number(oldi);
                };
            }

            for (i = i + 1; i < brothers.length; i++) {
                if (brothers[i]._id && brothers[i] != workitem) {
                    brothers[i].index = Number(i);
                };
            }


        }
        //move workItem end

        //internal get functions start
        var _getWIInScope = function(workitemId, node) {
            var currentWI;
            if (node) {
                currentWI = node;
            } else {
                currentWI = $scope.root;
            }
            if (currentWI._id == workitemId) {
                return currentWI;
            } else if (currentWI.childItems) {
                for (var i in currentWI.childItems) {
                    var wi = _getWIInScope(workitemId, currentWI.childItems[i]);
                    if (wi) {
                        return wi;
                    }
                }
            } else {
                return false;
            }
        }

        // get pre workitem
        var _getPreWI = function(workitem) {
            if (!workitem || !workitem.parent) return;

            // find pre brother
            var parentNode = _getWIInScope(workitem.parent);
            var brothers = parentNode.childItems;
            var brother;
            var i = 0;
            var findLastestChild = function(node) {
                // if the workitem is expand and has child, need to find the last child
                if (node.expand && node.childItems && node.childItems.length > 0) {
                    node = node.childItems[node.childItems.length - 1];
                    node = findLastestChild(node);
                }
                return node;
            }

            for (i; i < brothers.length; i++) {
                if (brothers[i] === workitem) {
                    brother = brothers[i - 1];
                    break;
                }
            }

            // if the workitem is the fisrt child, move to parent workitem
            if (i == 0) {
                return parentNode;
            }

            //if the deleted workitem is hidden, should jump over the item, and find pre brother of it
            if (!$scope.displaydeleted && brother.status == "deleted") {
                brother = _getPreWI(brother);

                //if the deleted workitem is the first child, should return the brother, as the brother is the parent now
                if (brother === parentNode) {
                    return brother;
                }
            }

            // if the workitem is expand and has child, need to find the last child
            // if (brother.expand && brother.childItems && brother.childItems.length > 0) {
            //     brother = brother.childItems[brother.childItems.length - 1];


            // }
            brother = findLastestChild(brother);
            //if the deleted workitem is hidden, should jump over the item, and find pre brother of it
            if ($scope.displaydeleted == false && brother.status == "deleted") {
                brother = _getPreWI(brother);
            }
            //return pre brother
            return brother;
        }


        //get next workitem
        var _getNextWI = function(workitem, findChild) {
            if ((!workitem || !workitem.parent) && workitem._id != $scope.root._id) return false;

            var brother;

            //if the workitem has child and opened, move to first child
            if ((workitem.expand || workitem._id == $scope.root._id) && workitem.childItems && workitem.childItems.length > 0 && findChild) {
                brother = workitem.childItems[0];
                if ($scope.displaydeleted == false && brother.status == "deleted") {
                    brother = _getNextWI(brother, true);
                }
                return brother;
            }

            //find sub brother
            var parentNode = _getWIInScope(workitem.parent);
            var brothers = parentNode.childItems;

            // if borther is closed or don't have child, find the sub borther in same level
            var i = 0;
            for (i; i < brothers.length; i++) {
                if (brothers[i] === workitem) {
                    brother = brothers[i + 1];
                    break;
                }
            }
            //if the workitem is the last child
            if (i == (brothers.length - 1)) {
                // if the parent workitem is not root, move the next workitem in parent level
                if (parentNode._id != $scope.root._id) {
                    brother = _getNextWI(parentNode, false);
                } else { // if the parent workitem is root, 
                    brother = _getNextWI(parentNode, true);
                }
            }

            //if the deleted workitem is hidden, should jump over the item, and find sub brother of it
            if (brother && $scope.displaydeleted == false && brother.status == "deleted") {
                brother = _getNextWI(brother);
            }

            // return sub brother
            return brother;

        }

        // get pre brother workitem
        var _getPreBrotherWI = function(workitem) {
            if (!workitem || !workitem.parent) return;

            // find pre brother
            var parentNode = _getWIInScope(workitem.parent);
            var brothers = parentNode.childItems;
            var brother;
            var i = 0;
            for (i; i < brothers.length; i++) {
                if (brothers[i] === workitem) {
                    brother = brothers[i - 1];
                    break;
                }
            }

            // if the workitem is the fisrt child, move to parent workitem
            if (i == 0) {
                return parentNode;
            }

            //if the deleted workitem is hidden, should jump over the item, and find pre brother of it
            if (!$scope.displaydeleted && brother.status == "deleted") {
                brother = _getPreBrotherWI(brother);

                //if the deleted workitem is the first child, should return the brother, as the brother is the parent now
                if (brother === parentNode) {
                    return brother;
                }
            }

            //return pre brother
            return brother;
        }


        //get next brother workitem
        var _getNextBrotherWI = function(workitem, findChild) {
                if ((!workitem || !workitem.parent) && workitem._id != $scope.root._id) return false;

                var brother;


                //find sub brother
                var parentNode = _getWIInScope(workitem.parent);
                var brothers = parentNode.childItems;

                // if borther is closed or don't have child, find the sub borther in same level
                var i = 0;
                for (i; i < brothers.length; i++) {
                    if (brothers[i] === workitem) {
                        brother = brothers[i + 1];
                        break;
                    }
                }
                //if the workitem is the last child
                if (i == (brothers.length - 1)) {
                    // if the parent workitem is not root, move the next workitem in parent level
                    if (parentNode._id != $scope.root._id) {
                        brother = _getNextBrotherWI(parentNode, false);
                    } else { // if the parent workitem is root, 
                        brother = _getNextBrotherWI(parentNode, true);
                    }
                }

                //if the deleted workitem is hidden, should jump over the item, and find sub brother of it
                if (brother && $scope.displaydeleted == false && brother.status == "deleted") {
                    brother = _getNextBrotherWI(brother);
                }

                // return sub brother
                return brother;

            }
            //internal get functions end


        // interface control start
        $scope.showHideAddItem = function(workItem) {
            if ($scope['addItem_' + workItem._id] == true) {
                $scope['addItem_' + workItem._id] = false;
                return;
            }
            $scope['addItem_' + workItem._id] = true;
        };

        $scope.showHideExpandIcon = function(workItem) {
            var show = false;
            if (workItem && workItem.nodeType == 'node' && workItem.childItems && workItem.childItems.length > 0) {
                if ($scope.displaydeleted == false) {
                    for (var i = 0; i < workItem.childItems.length; i++) {
                        if (workItem.childItems[i].status && workItem.childItems[i].status != "deleted") {
                            show = true;
                            break;
                        }
                    }
                } else {
                    show = true;
                }
            } else if (workItem && workItem.nodeType == 'node' && !workItem.childItems) {
                show = true;
            }
            return show;
        }

        $scope.addContent = function(workitem) {
            workitem.showContent = true;
        }

        $scope.toggleToolBar = function(workitem) {
            if (workitem.showToolBar && workitem.showToolBar == true) {
                workitem.showToolBar = false;
            } else {
                workitem.showToolBar = true;
            }
        }

        $scope.toggleEdit = function() {
            if ($scope.editable && $scope.editable == true) {
                $scope.editable = false;
            } else {
                $scope.editable = true;
            }
        }

        $scope.toggleDeleted = function() {
            if ($scope.displaydeleted && $scope.displaydeleted == true) {
                $scope.displaydeleted = false;
            } else {
                $scope.displaydeleted = true;
            }
            //load all expaned delete workitem's child
            for (var wi in $scope.root.childItems) {
                if ($scope.root.childItems[wi].status == "deleted") {
                    $scope.findChild($scope.root.childItems[wi]);
                }
            }
        }

        $scope.toggleExpand = function(workitem) {
            if (workitem.expand && workitem.expand == true) {
                workitem.expand = false;
            } else {
                workitem.expand = true;
            }
            $scope.update(workitem, $scope.findChild);
        }

        var _savedStatus = function() {
            $scope.saveStatus = "Saved";
        }

        var _savingStatus = function() {
            $scope.saveStatus = "Saving";
        }


        // interface control end


        //export function start
        $scope.exportTo = function(workitem, type) {
            $scope.exportResult = "";
            if (workitem) {
                $scope.exportNode = workitem;
            }
            if (type && type == "MD") {
                $scope.workOnChildren($scope.exportNode, true, 0, $scope.exportT.exportToMarkDown);
            } else {
                $scope.workOnChildren($scope.exportNode, true, 0, $scope.exportT.exportToPlainText);
            }

        }
        //export function end
    }
]).directive('ngSubject', function($timeout) { // this function don't used, just a testing for directive
    return {
        restrict: 'A',
        require: '^ngSubject',
        scope: {
            ngSubject: '=',
            trigger: '=focusMe',
            ngKeyword: '='
        },
        template: '',
        controller: ['$scope', 'decorator',
            function($scope, decorator) {
                $scope.decorator = new decorator();
            }
        ],
        link: function(scope, element, attrs) {
            scope.$watch('ngSubject', function(value){
                element.html(scope.decorator.decorate4dir(value, scope.ngKeyword)); 
            });

            scope.$watch('ngKeyword', function(value){
                element.html(scope.decorator.decorate4dir(scope.ngSubject, value)); 
            });


            scope.$watch('trigger', function(value) {
                if (value === true) {
                    //console.log('trigger',value);
                    $timeout(function() {
                        //if(!scope.$digest){
                        element[0].focus();
                        scope.trigger = false;
                        //}
                    });
                }
            });
            //scope.getTemp(iAttrs.ngSubject);
        }
    }
});