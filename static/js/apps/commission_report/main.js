define([
		'jquery'
		, 'underscore'
		, 'backbone'
		, 'utils/fetchData'
		, 'utils/perspective'
		, 'utils/dollarAndCentsAmountFunction'
		, 'utils/color'
		, 'utils/donut'
		, 'utils/donutLegendMixin'
		, 'utils/dateSelector'
		, 'apps/commission_report/allFunctions'
	], function($, _, Backbone){
	var commissionReport = {};

	commissionReport.getLastThreePayPeriods = function(callback){
        var fetchPayPeriodsRequest = '<fetch distinct="true" mapping="logical" count="3" >' +
							    '<entity name="syboo_transaction" >' +
							        '<attribute name="syboo_payee_cmm_date" />' +
							        '<order attribute="syboo_payee_cmm_date" descending="true" />' +
							        '<filter type="and" >' +
							            '<condition attribute="ownerid" operator="eq-userteams" />' +
							        '</filter>' +
							        '<filter type="or" >' +
							            '<condition attribute="syboo_payee_cmm_date" operator="this-year" />' +
							            '<condition attribute="syboo_payee_cmm_date" operator="last-year" />' +
							        '</filter>' +
							    '</entity>' +
							'</fetch>';

        syboo.utils.fetchData(fetchPayPeriodsRequest, function(data){
            var rowsData = []
                , results = data.Body.ExecuteResponse.ExecuteResult.Results;
            if(results.KeyValuePairOfstringanyType.key == 'EntityCollection'){
                var entities = results.KeyValuePairOfstringanyType.value.Entities;
                var entityData = entities.Entity;
                _.each(entityData, function(entity){
                    if(!_.isUndefined(entity.Attributes)){
                        var formattedKVData = entity.FormattedValues.KeyValuePairOfstringstring;
                        rowsData.push(formattedKVData.value);
                    }
                });
            }
            if(typeof callback == 'function'){
                callback(rowsData);
            }
        });
	}

	commissionReport.init = function(){
		syboo.eventBus = _.extend(this, Backbone.Events);

	    syboo.eventBus.on('sliceMouseover', syboo.onSliceMouseover);
	    syboo.eventBus.on('donutMouseout', syboo.onDonutMouseout);
	    syboo.eventBus.on('onLegendContainerMouseout', syboo.onDonutMouseout);
	    syboo.eventBus.on('categorySelected', syboo.onProductTypeSelected);
	    syboo.eventBus.on('dateRangeUpdated', syboo.dateRangeUpdated);

	    commissionReport.getLastThreePayPeriods(function(payPeriods){
	    	syboo.initSummary();
	    	syboo.utils.dateSelector.initialize(payPeriods);
	    	syboo.initGrid();

	    	$('#commissions .quickPickItem.selected').trigger('click');

	    	$(document).on('click', '.breadcrumb .allProductTypes', function(e){
		        e.preventDefault();
		        syboo.allProductTypesSelected();
		    });
	    
	    	$(document).on('change', '.hasDatepicker', syboo.utils.dateSelector.onDatePickerChange);
	    	
	    	$('.incomeSummary').click(function(e){
	    		e.preventDefault();
	    		var el = $(e.currentTarget);
	    		if(el.hasClass('active')){
	    			el.removeClass('active');
	    			$('.incomeDetails').fadeOut();
	    		}else{
	    			el.addClass('active');
	    			$('.incomeDetails').fadeIn();
	    		}
	    	});
	    });
	}

	return commissionReport;
})