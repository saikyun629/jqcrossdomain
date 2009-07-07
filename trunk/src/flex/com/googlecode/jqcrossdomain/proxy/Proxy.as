package com.googlecode.jqcrossdomain.proxy {
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.events.HTTPStatusEvent;
	import flash.events.IOErrorEvent;
	import flash.events.SecurityErrorEvent;
	import flash.external.ExternalInterface;
	import flash.system.Security;
	import flash.net.URLRequest;
	import flash.net.URLLoader;
	[SWF(backgroundColor="#ffffff",width="1",height="1",frameRate="20")]
	public class Proxy extends Sprite {
		public static const BIND_FUNCTION_NAME:String = "bindCallback";
		private var httpStatus:Object = {};
		public function Proxy() {
			Security.allowDomain(loaderInfo.parameters.host);
			addEventListener(Event.ADDED_TO_STAGE,init);
		}
		private function init(e:Event):void {
			ExternalInterface.addCallback(BIND_FUNCTION_NAME,bindCallback);
			var rf:String = loaderInfo.parameters.readyFuncName;
			if(rf) ExternalInterface.call(rf);
			removeEventListener(Event.ADDED_TO_STAGE,init);
		}
		private function bindCallback(funcname:String,s:Object):void {
			var url:String = s.url;
			var loader:URLLoader = new URLLoader();
			if(s.policyFile) {
				Security.loadPolicyFile(s.policyFile);
			}
			loader.addEventListener(HTTPStatusEvent.HTTP_STATUS,function(e:HTTPStatusEvent):void{
				httpStatus[funcname] = e.status;
			});
			var cb:Function = function(e:Event):void{
				ExternalInterface.call(funcname,httpStatus[funcname]||200,String(loader.data));
				loader = null;
			}
			loader.addEventListener(Event.COMPLETE,cb);
			loader.addEventListener(IOErrorEvent.IO_ERROR,function(e:IOErrorEvent):void{
				httpStatus[funcname] = 404;
				cb(e);
			});
			loader.addEventListener(SecurityErrorEvent.SECURITY_ERROR,function(e:SecurityErrorEvent):void{
				httpStatus[funcname] = 403;
				cb(e);
			});
			loader.load(new URLRequest(url));
		}
	}
}
