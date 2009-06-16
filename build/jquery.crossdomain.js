/**
 * @fileOverview Extend jQuery.fn.ajax for CrossDomain AJAX
 * @author Atsushi Nagase nagase@ngsdev.org
 */
;(function($){
/* @constants */
var FILENAME = "jquery.crossdomain.js",
	DS="\/", QS="?", AMP="&",
	JS_EXT="\.js", SWF_EXT="\.swf",
	DIV_ID_PREFIX = "jqcrossdomain-",
	SWF_ID_PREFIX = "external_jqcrossdomain",
	CALLBACK_ID_PREFIX = "jqcrossdomainCallback",
	REQUIRED_VERSION = "9.0",
	ERROR_NOT_INITIALIZED = "jquery.crossdomain is not initialized!",
	EXTERNAL_SRC_REGEXP = /^https?:\/\/.*/,
	JSONP_REGEXP = /=\?(&|$)/g;

/** @private */
var ajaxOrg = $.ajax,
	swfPath,
	loadParam,
	divId,
	swfId,
	rnd,
	policyFile,
	initialized=false,
	swfObj,
	cache = {};

function getScriptTag() {
	var stag = $("script");
	stag.each(function(){
		var a1 = ($(this).attr("src")||"").split(QS);
		var q = a1.pop();
		var a2 = (a1[0]||"").split(DS);
		if(a2.length&&a2[a2.length-1]==FILENAME) {
			loadParam = {};
			$.each((q||"").split(AMP),function(){
				var kv = String(this).split("=");
				loadParam[kv[0]] = kv[1];
			});
			swfPath = loadParam.swf || a2.join(DS).replace(JS_EXT,SWF_EXT);
			return false;
		}
	});
}

function onLoaderCallback(s,id,status,data) {
	switch(s.type) {
		case "json":
			try {
				data = eval("("+data+")");
			} catch(e) {
				return onLoaderError(s,id,status);
			}
			break;
		case "xml":
			data = $(data);
			break;
		default:
			data = String(data);
			break;
	}
	if(s.success) s.success(data,status);
	if(s.global) $.evant.trigger("ajaxSucces",[null,s]);
	deleteCallback(id);
}

function onLoaderError(s,id,status) {
	
	deleteCallback(id);
}

function deleteCallback(id) {
	window[CALLBACK_ID_PREFIX+id] = undefined;
	try { delete window[CALLBACK_ID_PREFIX+id]; } catch(e) {}
}

function ajax(s) {
	s = $.extend(true, s, $.extend(true, {}, jQuery.ajaxSettings, s));
	if(!initialized) throw new Error(ERROR_NOT_INITIALIZED);
	if(!s.url.match(EXTERNAL_SRC_REGEXP)||s.type=="script"||s.url.match(JSONP_REGEXP)) {
		return ajaxOrg(s);
	}
	do {
		var r = getRandom();
	} while(window[CALLBACK_ID_PREFIX+r]);
	window[CALLBACK_ID_PREFIX+r] = function(status,data) {
		onLoaderCallback(s,r,status,data);
	}
	trace(s);
	swfObj = $("#"+swfId)[0];
	trace(swfObj.bindCallback);
	try {
		swfObj.bindCallback("window."+CALLBACK_ID_PREFIX+r,s.url,s.policyFile||"");
	} catch(e) { trace(e); }
}

function getRandom() {
	return String(~~(Math.random()*100000000));
}

function trace(a) {
	try {
		console.log(a)
	} catch(e) {};
}

function init() {
	do {
		rnd = getRandom();
		divId = DIV_ID_PREFIX+rnd;
		swfId = SWF_ID_PREFIX+rnd;
	} while($(divId).size());
	$("body").append([
		"<div id=\"",divId,"\" style=\"visibility:hidden;height:1px;width:1px;position:absolute;top:-9999px;left:-9999px;overflow:hidden;\">",
			"<div id=\""+swfId+"\" \/>",
		"<\/div>"
	].join(""));
	var fvars = {
		rnd:rnd,
		host:document.location.protocol+DS+DS+document.location.host
	};
	var fprm = {};
	var fatr = {
		"allowScriptAccess":"always"
	};
	swfobject.embedSWF(swfPath,swfId,1,1,REQUIRED_VERSION,null,fvars,fprm,fatr);
	initialized = true;
}

getScriptTag();
$.ajax = ajax;
$(init);


})(jQuery);
