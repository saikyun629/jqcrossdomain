package com.googlecode.jqcrossdomain.proxy {
	import flash.display.Sprite;
	import flash.events.Event;
	import flash.external.ExternalInterface;
	import flash.system.Security;
	import flash.net.URLRequest;
	import flash.net.URLLoader;
	[SWF(backgroundColor="#ffffff",width="1",height="1",frameRate="20")]
	public class Proxy extends Sprite {
		public static const BIND_FUNCTION_NAME:String = "bindCallback";
		public function Proxy() {
			Security.allowDomain(loaderInfo.parameters.host);
			addEventListener(Event.ADDED_TO_STAGE,init);
		}
		private function init(e:Event):void {
			ExternalInterface.addCallback(BIND_FUNCTION_NAME,bindCallback);
			removeEventListener(Event.ADDED_TO_STAGE,init);
		}
		private function bindCallback(funcname:String,url:String,policyFile:String=""):void {
			var loader:URLLoader = new URLLoader()
			if(policyFile) {
				Security.loadPolicyFile(policyFile);
			}
			loader.addEventListener(Event.COMPLETE,function(e:Event):void{
				ExternalInterface.call(funcname,200,String(loader.data));
			});
			loader.load(new URLRequest(url));
		}
	}
}
