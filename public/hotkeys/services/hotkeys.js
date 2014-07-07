'use strict';
angular.module('mean.mhotkeys',[]);
angular.module('mean.mhotkeys').factory('Mhotkeys', ['$resource', function($resource,mhotkeys) {   
   var exports = {};
   exports.hotkeys = {
       		
		specialKeys: { 27: 'esc', 9: 'tab', 32:'space', 13: 'enter', 8:'backspace', 145: 'scroll', 
            20: 'capslock', 144: 'numlock', 19:'pause', 45:'insert', 36:'home', 46:'del',
            35:'end', 33: 'pageup', 34:'pagedown', 37:'left', 38:'up', 39:'right',40:'down', 
            112:'f1',113:'f2', 114:'f3', 115:'f4', 116:'f5', 117:'f6', 118:'f7', 119:'f8', 
            120:'f9', 121:'f10', 122:'f11', 123:'f12' ,83:'S',68:'D',84:'T'},
        
        shiftNums: { "`":"~", "1":"!", "2":"@", "3":"#", "4":"$", "5":"%", "6":"^", "7":"&", 
            "8":"*", "9":"(", "0":")", "-":"_", "=":"+", ";":":", "'":"\"", ",":"<", 
            ".":">",  "/":"?",  "\\":"|" },
			
        hotkeyMap:{},
  
    };
	
	exports.extend = function(destination,source){
	  for (var property in source)
		  destination[property] = source[property];
	   return destination;

	}
    if (navigator.userAgent.indexOf("Firefox")!=-1){
        exports.hotkeys.specialKeys = exports.extend(exports.hotkeys.specialKeys,  { 96: '0', 97:'1', 98: '2', 99: 
            '3', 100: '4', 101: '5', 102: '6', 103: '7', 104: '8', 105: '9' });
    }
   exports.add=function(myhotkeys){
      exports.hotkeys.hotkeyMap=exports.extend(exports.hotkeys.hotkeyMap,myhotkeys);
   }
   exports.stopDefault=function(e){
      if(e&&e.preventDefault){
	     e.preventDefault();
	  }else{
		 window.event.returnValue = false;   
	  }
	  if(e&&e.stopPropagation){
	     e.stopPropagation();
	  }else{
	     window.event.cancelBubble = true;
	  }
   }
   
	exports.triger=function(workitem,event){
	 event = (event) ? event : ((window.event) ? window.event : "") 
     var keycode = event.keyCode ? event.keyCode : (event.which ? event.which : event.charCode); 
	 var shift=event.shiftKey;
	 var ctrl=event.ctrlKey;
	 var alt=event.altKey;
	 if(shift||ctrl||alt){
	   
	   if(exports.hotkeys.specialKeys[keycode]){
			 var com="shift+";
			 if(ctrl){
			  com="ctrl+";
			  if(shift)
			   com="ctrl+shift+";
			 }else if(alt){
			  com="alt+";
			 }
			com=com+exports.hotkeys.specialKeys[keycode];
			if(exports.hotkeys.hotkeyMap[com]){
			   exports.stopDefault(event);
			  (exports.hotkeys.hotkeyMap[com])(workitem);
			
			}
		 }
	  }else{
	     if(exports.hotkeys.specialKeys[keycode]){
		    var mykey=exports.hotkeys.specialKeys[keycode];
		    if(exports.hotkeys.hotkeyMap[mykey]){
			   exports.stopDefault(event);
			   (exports.hotkeys.hotkeyMap[mykey])(workitem);
			  
			}
		 
		 }
	  }
	
	}

	return exports;
}]);
