//
//
var API_AREAS = "http://jws.jalan.net/APICommon/AreaSearch/V1/";
var API_HOTELS = "http://jws.jalan.net/APIAdvance/HotelSearch/V1/";

$(function(){
	var 
		selectReg = $("select[name='reg']"),
		selectPref = $("select[name='pref']"),
		selectLArea = $("select[name='l_area']"),
		selectSArea = $("select[name='s_area']"),
		form = $("form#drilldown"),
		submitButton = $("input:submit"),
		apiKey = $("input[name='key']").val(),
		selects = [selectReg,selectPref,selectLArea,selectSArea],
		defaults;
	//
	function init() {
		defaults = [];
		var len = selects.length;
		$.each(selects,function(i){
			var _this = $(this);
			_this.attr("disabled","disabled");
			_this.bind("change",function(){
				var idx = this.selectedIndex-1;
				var list = _this.data("list");
				if(list&&list[idx]&&list[idx].children) {
					appendOptions(i+1,list[idx].children);
				}
			});
			defaults[i] = _this.html();
		});
		form.bind("submit",onFormSubmit);
		$.ajax({
			type:"xml",
			url:API_AREAS+"?key="+apiKey,
			policyFile:"http://jws.jalan.net/crossdomain.xml",
			success:function(d){
				onLoadRegions(getList($("Region",d)));
			}
		});
	}
	function getList(nodeList) {
		var rtn = [];
		nodeList.each(function(){
			rtn.push(getObject($(this)));
		});
		return rtn;
	}
	function getObject(node) {
		var nn = (node[0].nodeName||"").toLowerCase();
		var name = node.attr("name");
		var code = node.attr("cd");
		var childName;
		switch(nn) {
			case "region": childName = "Prefecture"; break;
			case "prefecture": childName = "LargeArea"; break;
			case "largearea": childName = "SmallArea"; break;
		}
		var rtn = { "name":name, "code":code };
		if(childName) rtn.children = getList($(childName,node));
		return rtn;
	}
	function onLoadRegions(regions) {
		appendOptions(0,regions);
	}
	function appendOptions(position,nodeList) {
		var select = selects[position];
		var def = defaults[position];
		select.data("list",nodeList);
		if(!nodeList||!nodeList.length) {
			select.html(def);
			select.attr("disabled","disabled");
			return;
		}
		var ht = [def];
		$.each(nodeList,function(){
			var code = this.code, name = this.name;
			ht.push("<option value=\""+code+"\">"+name+"<\/option>");
		});
		select.html(ht.join(""));
		select.attr("disabled","");
		select.val("");
		for(var i=position+1;i<selects.length;i++) {
			appendOptions(i,null);
		}
		submitButton.attr("disabled",selects[0].val()?"":"disabled");
	}
	function onFormSubmit() {
		var len = selects.length;
		for(var i=len-1;i>=0;--i) {
			var sel = selects[i];
			var val = sel.val();
			var key = sel.attr("name");
			if(val) break;
		}
		getResults(key,val);
		return false;
	}
	function getResults(key,value) {
		$.ajax({
			type:"xml",
			url:API_HOTELS+"?pict_size=2&key="+apiKey+"&"+key+"="+value,
			policyFile:"http://jws.jalan.net/crossdomain.xml",
			success:onLoadResults
		});
	}
	function onLoadResults(d) {
		var ht = ["<ol>"];
		$("Hotel",d).each(function(){
			ht.push(getCassette($(this)));
		});
		ht.push("<\/ol>");
		$("#results").html(ht.join(""));
	}
	function getCassette(d) {
		var name = $("HotelName",d).text()||"";
		var url = $("HotelDetailURL",d).text()||"";
		var copy = $("HotelCatchCopy",d).text()||"";
		var pict = $("PictureURL",d).text()||"";
		return [
			"<li>",
				"<p class=\"pict\"><img src=\"",pict,"\" \/><\/p>",
				"<h3><a href=\"",url,"\">",name,"<\/a><\/h3>",
				"<p class=\"copy\">",copy,"<\/p>",
			"<\/li>"
		].join("");
	}
	setTimeout(init,1000)
});