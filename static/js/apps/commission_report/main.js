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
		, 'utils/gridSearch'
		, 'apps/commission_report/allFunctions'
	], function($, _, Backbone){
	var commissionReport = {};

	commissionReport.getAllPayPeriods = function(callback){
        var fetchPayPeriodsRequest = '<fetch distinct="true" mapping="logical" >' +
									    '<entity name="syboo_transaction" >' +
									        '<attribute name="syboo_payee_cmm_date" />' +
									        '<order attribute="syboo_payee_cmm_date" descending="true" />' +
									        '<filter type="and" >' +
									            '<condition attribute="ownerid" operator="eq-userteams" />' +
									            '<condition attribute="syboo_payee_cmm_date" operator="on-or-after" value="02/01/1900" />' +
									        '</filter>' +
									    '</entity>' +
									'</fetch>';

        console.log('fetchAllPayPeriods', fetchPayPeriodsRequest)
        syboo.utils.fetchData(fetchPayPeriodsRequest, function(data){
        	if(_.isUndefined(data)){
        		callback([]);
        		return;
        	}
            var rowsData = []
                , results = data.Body.ExecuteResponse.ExecuteResult.Results;
            if(results.KeyValuePairOfstringanyType.key == 'EntityCollection'){
                var entities = results.KeyValuePairOfstringanyType.value.Entities;
                var entityData = _.isArray(entities.Entity) ? entities.Entity : [entities.Entity];
                _.each(entityData, function(entity){
                    if(!_.isUndefined(entity) && !_.isUndefined(entity.Attributes)){
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
		$('body').scrollTop(0);
		
		syboo.eventBus = _.extend(this, Backbone.Events);

	    syboo.eventBus.on('sliceMouseover', syboo.onSliceMouseover);
	    syboo.eventBus.on('donutMouseout', syboo.onDonutMouseout);
	    syboo.eventBus.on('onLegendContainerMouseout', syboo.onDonutMouseout);
	    syboo.eventBus.on('categorySelected', syboo.onCategorySelected);
	    syboo.eventBus.on('dateRangeUpdated', syboo.dateRangeUpdated);

	    commissionReport.getAllPayPeriods(function(payPeriods){
	    	syboo.initSummary(payPeriods.slice(0, 3));
	    	syboo.utils.dateSelector.initialize(payPeriods);
	    	syboo.initGrid();

	    	$('.quickPickItem.selected').trigger('click');

	    	$(document).on('click', '.breadcrumb .allProductTypes', function(e){
		        e.preventDefault();
		        syboo.allProductTypesSelected();
		    });

		    $(document).on('click', '.breadcrumb .backToProductType', function(e){
		        e.preventDefault();
		        var el = $(e.currentTarget),
		        	productType = el.data('product-type');
		        	
		        syboo.backToProductType(productType);
		    });

		    $(document).on('click', '.exportAsCSV', function(e){
		    	e.preventDefault();
		    	var el = $(e.currentTarget);
		    	el.fadeOut();
		    	syboo.getDataExport(function(data){
		    		var csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(data);
		    		$('.csvFile').attr({
		    			'href': csvData
		    		});
		    		$('.csvFileWrapper').fadeIn();
		    	});
		    });

		    $('.removeCSVFile').click(function(e){
		    	e.preventDefault();
		    	$('.csvFileWrapper').fadeOut(function(){
		    		$('.exportAsCSV').show();
		    	});
		    })
	    
	    	$(document).on('change', '.hasDatepicker', syboo.utils.dateSelector.onDatePickerChange);
	    	
	    	$('.incomeSummary').click(function(e){
	    		e.preventDefault();
	    		var el = $(e.currentTarget);
	    		if(el.hasClass('active')){
	    			el.removeClass('active');
	    			el.find('.tooltip').text('(Click to View Details)');
	    			$('.incomeDetails').fadeOut();
	    		}else{
	    			el.addClass('active');
	    			el.find('.tooltip').text('(Click to Hide Details)');
	    			$('.incomeDetails').fadeIn();
	    		}
	    	});
	    });
	}

	return commissionReport;
})