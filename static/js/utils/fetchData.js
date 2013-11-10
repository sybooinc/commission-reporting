(function(){

	// get reference
	var syboo = window.syboo || {}
		, utils = syboo.utils || {};

	var _buildFetchRequest = function(fetch) {
		// http://blog.customereffective.com/blog/2011/05/execute-fetch-from-javascript-in-crm-2011.html
		var request = "<s:Envelope xmlns:s=\"http://schemas.xmlsoap.org/soap/envelope/\">";
		request += "<s:Body>"; 

		request += '<Execute xmlns="http://schemas.microsoft.com/xrm/2011/Contracts/Services">' + 
		'<request i:type="b:RetrieveMultipleRequest" ' + 
		' xmlns:b="http://schemas.microsoft.com/xrm/2011/Contracts" ' + 
		' xmlns:i="http://www.w3.org/2001/XMLSchema-instance">' + 
		'<b:Parameters xmlns:c="http://schemas.datacontract.org/2004/07/System.Collections.Generic">' + 
		'<b:KeyValuePairOfstringanyType>' + 
		'<c:key>Query</c:key>' + 
		'<c:value i:type="b:FetchExpression">' + 
		'<b:Query>';

		request += CrmEncodeDecode.CrmXmlEncode(fetch); 

		request += '</b:Query>' + 
		'</c:value>' + 
		'</b:KeyValuePairOfstringanyType>' + 
		'</b:Parameters>' + 
		'<b:RequestId i:nil="true"/>' + 
		'<b:RequestName>RetrieveMultiple</b:RequestName>' + 
		'</request>' + 
		'</Execute>'; 

		request += '</s:Body></s:Envelope>'; 
		return request;
	}

	utils.fetchData = function(request, callback){
		var server = window.location.protocol + "//" + window.location.host
			, path = server + "/XRMServices/2011/Organization.svc/web";
	
		$.ajax({
			type: "POST",
			dataType: "xml",
			contentType: "text/xml; charset=utf-8",
			processData: false,
			url: path,
			data: _buildFetchRequest(request),
			beforeSend: function( xhr ){
				xhr.setRequestHeader(
					"SOAPAction",
					"http://schemas.microsoft.com/xrm/2011/Contracts/Services/IOrganizationService/Execute"
				); //without the SOAPAction header, CRM will return a 500 error
			}
		}).done(function(xmlData) {
			var jsonData = $.xml2json(xmlData);
			if(typeof callback == 'function'){
				callback(jsonData);
			}
		}).fail(function(jqXHR, textStatus, errorThrown ) {
			if(console && console.log)
				console.log('failed to get data', errorThrown);
		});
	};

	// set reference back
	syboo.utils = utils;
	window.syboo = syboo;
})();