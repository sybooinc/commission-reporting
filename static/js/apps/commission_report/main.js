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
		, 'apps/commission_report/tempMain'
	], function($, _, Backbone){
	var commissionReport = {};

	commissionReport.init = function(){
		syboo.eventBus = _.extend(this, Backbone.Events);

	    syboo.eventBus.on('sliceMouseover', syboo.onSliceMouseover);
	    syboo.eventBus.on('donutMouseout', syboo.onDonutMouseout);
	    syboo.eventBus.on('onLegendContainerMouseout', syboo.onDonutMouseout);
	    syboo.eventBus.on('categorySelected', syboo.onProductTypeSelected);
	    syboo.eventBus.on('dateRangeUpdated', syboo.dateRangeUpdated);

	    syboo.utils.dateSelector.initialize();

	    $(document).on('click', '.breadcrumb .allProductTypes', function(e){
	        e.preventDefault();
	        syboo.allProductTypesSelected();
	    });
	    $(document).on('change', '.hasDatepicker', syboo.utils.dateSelector.onDatePickerChange);

	    syboo.initGrid();

	    $('#commissions .quickPickItem.selected').trigger('click');
	}

	return commissionReport;
})