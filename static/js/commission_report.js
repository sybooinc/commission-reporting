require(['require_config'], function(){
	// fix console object
	if(typeof window.console == 'undefined'){
	    window.console = {
	        log: function(){}
	        , dir: function(){}
	        , error: function(){}
	        , debug: function(){}
	        , info: function(){}
	    };
	}
});
// load app related main javascript
require(['apps/commission_report/main'], function(CommissionReportApp){
	CommissionReportApp.init();
});