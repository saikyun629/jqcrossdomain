/**
 * @fileOverview Extend jQuery.fn.ajax for CrossDomain AJAX
 * @author Atsushi Nagase nagase@ngsdev.org
 */
;(function($){
/* @constants */
var FILENAME = "jquery.crossdomain.js",
	//
	DS="\/", QS="?", AMP="&",
	JS_EXT="\.js", SWF_EXT="\.swf",
	DIV_ID_PREFIX = "jqcrossdomain-",
	SWF_ID_PREFIX = "external_jqcrossdomain",
	CALLBACK_ID_PREFIX = "jqcrossdomainCallback",
	REQUIRED_VERSION = "9.0",
	ERROR_NOT_INITIALIZED = "jquery.crossdomain is not initialized!",
	EXTERNAL_SRC_REGEXP = /^https?:\/\/.*/,
	JSONP_REGEXP = /=\?(&|$)/g,
	STATUS_SUCCESS = "success",
	STATUS_PARSE_ERROR = "parseerror",
	STATUS_NOT_MODIFIED = "notmodified",
	STATUS_TIMEOUT = "timeout",
	STATUS_ERROR = "error",
	EVENT_AJAX_SUCCESS = "ajaxSucces",
	EVENT_AJAX_COMPLETE = "ajaxComplete",
	EVENT_AJAX_ERROR = "ajaxError";

/** @private */
var ajaxOrg = $.ajax,
	swfPath, swfObj, loadParam,
	divId, swfId, rnd, policyFile,
	initialized=false,
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
	var type = (s.type||"").match(/^GET$|^POST$/) ? (s.dataType||"text"):s.type;
	var st;
	switch(status) {
		case 200:
			st = STATUS_SUCCESS;
			break;
		case 304:
			st = STATUS_NOT_MODIFIED;
			break;
		default:
			return handleError(s,id,STATUS_ERROR);
	}
	switch(type) {
		case "json":
			try {
				data = eval("("+data+")");
			} catch(e) {
				return handleError(s,id,STATUS_PARSE_ERROR);
			}
			break;
		case "xml":
			data = $($(data)[1]);
			break;
		default:
			data = String(data);
			break;
	}
	var xhr = null;
	var st = status == 304 ? STATUS_NOT_MODIFIED : STATUS_SUCCESS;
	if(s.success) s.success(data,st);
	if(s.complete) s.complete(data,st);
	if(s.global){
		$.event.trigger(EVENT_AJAX_SUCCESS,[xhr,s]);
		$.event.trigger(EVENT_AJAX_COMPLETE,[xhr,s]);
	}
	deleteCallback(id);
}

function handleError(s,id,status,e) {
	var xhr = null;
	if(s.error) s.error(xhr,status,e);
	if(s.global) $.event.trigger(EVENT_AJAX_ERROR,[xhr,s,e]);
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
		swfObj.bindCallback("window."+CALLBACK_ID_PREFIX+r,s);
	} catch(e) { trace(e); }
}

function getRandom() {
	return String(Math.abs(~~(Math.random()*new Date().getTime())));
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
