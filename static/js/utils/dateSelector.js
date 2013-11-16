define(['moment'], function(moment){
	// get reference
	var syboo = window.syboo || {}
		, utils = syboo.utils || {};

	utils.dateSelector = {};

	utils.dateSelector.initialize = function(){
		// show the applicabale quarters quick picks
		var currentQuarter = Math.floor(moment().month() / 3) + 1;
		$('.quickPickMenu .quarter').slice( (-1 * currentQuarter) ).show();
		
        $('.quickPick').on('click', syboo.utils.dateSelector.toggleQuickPickMenu);
        $('.quickPickItem').on('click', syboo.utils.dateSelector.onQuickDatePick);
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
    utils.dateSelector.onQuickDatePick = function(event) {
        var self = this;
        var quickPickMenu = $('.quickPickMenu');
        var data = $(event.target).data();

        $('.quickPickItem.selected').removeClass('selected');
        $(event.target).addClass('selected');

        var endDate = moment().format('MM/DD/YYYY')
            , startDate;

        switch(data.operator){
            case 'pending': {
                startDate = moment('01/01/1900').format('MM/DD/YYYY');
                endDate = moment('01/01/1901').format('MM/DD/YYYY');
                break;
            }
            case 'quarter': {
            	var startMonth = ( ( Number( data.value ) * 3 ) )
            		, endMonth = startMonth + 3;
                startDate = moment( { d: 1, M: startMonth} ).format('MM/DD/YYYY');
                endDate = moment( { d: 0, M: endMonth} ).format('MM/DD/YYYY');
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
            $('.quickPick>span').html($(event.target).text());
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
    utils.dateSelector.closeQuickPick = function(e){
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