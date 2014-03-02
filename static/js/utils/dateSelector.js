define(['moment'], function(moment){
	// get reference
	var syboo = window.syboo || {}
		, utils = syboo.utils || {};

	utils.dateSelector = {};
	utils.dateSelector.payPeriods = [];
    var quarterMap = {
        '0': 'First',
        '1': 'Second',
        '2': 'Third',
        '3': 'Fourth'
    }

	utils.dateSelector.initialize = function(payPeriods){
		// set the last three pay periods
		var mPayPeriods = _.map(payPeriods, function(payPeriod){
			return moment(payPeriod, 'MM/DD/YYYY').format('YYYY-MM-DD');
		});

        _.each(mPayPeriods, function(payPeriod) {
            $('.quickPickItem .payPeriods').append($('<option/>', {
                value: payPeriod,
                text: payPeriod
            }));
        });

		// show the applicabale quarters quick picks
		var currentQuarter = Math.floor(moment().month() / 3) + 1;
        var quarters = [];
        for(var i = currentQuarter; i > 0; i--){
            quarters.push(i - 1);
        }
        _.each(quarters, function(quarter){
            $('.quickPickItem .quarters').append($('<option/>', {
                value: quarter,
                text: quarterMap[quarter]
            }));
        });

        // show the applicable years
        var allYears = _.map(payPeriods, function(payPeriod){
            return moment(payPeriod, 'MM/DD/YYYY').year();
        });
        var uniqueYears = _.uniq(allYears);
        _.each(uniqueYears, function(year){
            $('.quickPickItem .years').append($('<option/>', {
                value: year,
                text: year
            }));
        });

        $('.quickPick').on('click', syboo.utils.dateSelector.toggleQuickPickMenu);

        $('.quickPickItem.pending').on('click', function(e){
            syboo.utils.dateSelector.onQuickDatePick(e.target);
        });
        $('.quickPickItem.dropdown select').on('change', function(e){
            if($(e.currentTarget).val() != '-1'){
                syboo.utils.dateSelector.onQuickDatePick($(e.currentTarget).parent('.quickPickItem'));
            }
        });

        $('.startDate').datepicker({
            beforeShow: function (textbox, instance) {
                instance.dpDiv.css({
                    marginTop: '0px',
                    marginLeft: '-70px'
                });
            }
        });
        $('.endDate').datepicker({
            beforeShow: function (textbox, instance) {
                    instance.dpDiv.css({
                    marginTop: '0px',
                    marginLeft: '-70px'
                });
            }
        });

        // initialize bar chart legend
        $('#barChartContainer .barLegend').html( Handlebars.compile( $("#template-ytd-legend").html() )( {previousYear: moment().subtract('year', 1).year(), currentYear: moment().year() } ) )
    }

    utils.dateSelector.toggleQuickPickMenu = function(e){
        e.preventDefault();
        var quickPickMenu = $('.quickPickMenu');
        if (quickPickMenu.hasClass('hidden')) {
            quickPickMenu.fadeIn(function() {
                quickPickMenu.removeClass('hidden');
                $('body').on('click', syboo.utils.dateSelector.closeQuickPick);
            });
        } else {
            quickPickMenu.fadeOut(function() {
                quickPickMenu.addClass('hidden');
                $('body').off('click', syboo.utils.dateSelector.closeQuickPick);
            });
        }
    }
    utils.dateSelector.onQuickDatePick = function(el) {
        var self = this;
        var quickPickMenu = $('.quickPickMenu');
        var $el = $(el);
        var data = $el.data();

        $('.quickPickItem.selected').removeClass('selected');
        $el.addClass('selected');

        var endDate = moment().format('MM/DD/YYYY')
            , startDate;

        switch(data.operator){
            case 'pending': {
                startDate = moment('01/01/1900').format('MM/DD/YYYY');
                endDate = moment('01/01/1901').format('MM/DD/YYYY');
                break;
            }
            case 'pay-period': {
                startDate = endDate = moment($('.quickPickItem > select.payPeriods').val(), 'YYYY-MM-DD').format('MM/DD/YYYY');
                break;
            }
            case 'quarter': {
            	var startMonth = ( ( Number( $('.quickPickItem > select.quarters').val() ) * 3 ) )
            		, endMonth = startMonth + 3;
                startDate = moment( { d: 1, M: startMonth} ).format('MM/DD/YYYY');
                endDate = moment( { d: 0, M: endMonth} ).format('MM/DD/YYYY');
                break;
            }
            case 'year': {
                var selectedYear = $('.quickPickItem > select.years').val();
                if(moment().year() == selectedYear){
                    startDate = moment().startOf('year').format('MM/DD/YYYY');
                }else{
                    endDate = moment('12/31/' + selectedYear).format('MM/DD/YYYY');
                    startDate = moment('01/01/' + selectedYear).format('MM/DD/YYYY');  
                }
                break;
            }
            case 'last-x-days': {
                startDate = moment().subtract('days', data.value).format('MM/DD/YYYY');
                break;
            }
            case 'last-x-months': {
                startDate = moment().subtract('months', data.value).format('MM/DD/YYYY');
                break;
            }
            case 'last-year': {
                endDate = moment('12/31/' + (moment().year() - 1)).format('MM/DD/YYYY');
                startDate = moment('01/01/' + (moment().year() - 1)).format('MM/DD/YYYY');
                break;
            }
            case 'this-year': {
                startDate = moment().startOf('year').format('MM/DD/YYYY');
                break;
            }
        }

        quickPickMenu.fadeOut(function() {
            quickPickMenu.addClass('hidden');
            if(data.operator == 'pending'){
                $('.quickPick>span').html($el.text());
            }else{
                $('.quickPick>span').html(data.label + ': ' + $el.find('select>option:selected').text());
            }
            
            if(data.operator == 'pending'){
                $('.startDate').val('');
                $('.endDate').val('');
            }else{
                $('.startDate').val(startDate);
                $('.endDate').val(endDate);
            }

            syboo.gridVariables.dateRange.operator = data.operator;
            syboo.gridVariables.dateRange.value = data.value;

            syboo.eventBus.trigger('dateRangeUpdated', {startDate: startDate, endDate: endDate});
        });
    }
    utils.dateSelector.closeQuickPick = function(event){
        if ($(event.target).closest('.quickPickMenu').length === 0) {
            var quickPickMenu = $('.quickPickMenu');
            if (!quickPickMenu.hasClass('hidden')) {
                quickPickMenu.fadeOut(function() {
                    quickPickMenu.addClass('hidden');
                });
            }
        }
    }
    utils.dateSelector.onDatePickerChange = function(e){
        $('.quickPick>span').html('custom');
        if($('.startDate').val() == ''){
            $('.startDate').val($('.endDate').val());
        }else if($('.endDate').val() == ''){
            $('.endDate').val($('.startDate').val());
        }
        syboo.eventBus.trigger('dateRangeUpdated', {startDate: $('.startDate').val(), endDate: $('.endDate').val()});
    }

	// set reference back
	syboo.utils = utils;
	window.syboo = syboo;
});