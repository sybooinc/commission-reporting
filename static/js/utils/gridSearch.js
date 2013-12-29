define([
	'jqueryCombobox'
],function(){
	// get reference
	var syboo = window.syboo || {}
		, utils = syboo.utils || {};

	utils.GridSearch2 = {};

	var filterOperators = {
        '=': 'eq'
        , '!=': 'ne'
        , '>': 'gt'
        , '>=': 'ge'
        , '<': 'lt'
        , '<=': 'le'
        , 'begins-with': 'like'
        , 'ends-with': 'like'
        , 'contains': 'like'
        , 'does-not-begin-with': 'not-like'
        , 'does-not-end-with': 'not-like'
        , 'does-not-contains': 'not-like'
    }

	utils.GridSearch2.init = function(searchField, searchOperator, searchValue, callback){
		searchField.combobox({
			change: function(event, ui){
				if(_.isNull(ui.item)){
					showError($(this), 'Please choose a search field');
				}else{
					hideError($(this));
				}
			}
		});
		searchOperator.combobox({
			change: function(event, ui){
				if(_.isNull(ui.item)){
					showError($(this), 'Please choose a search operator');
				}else{
					hideError($(this));
				}
			}
		});
		searchValue
          .bind( "keydown", function( event ) {
            if ( event.keyCode === $.ui.keyCode.ENTER ) {
                searchValue.siblings('.btn.searchHandle').trigger('click');
            }
          })
		searchValue.siblings('.btn.searchHandle').on('click', function(e){
            e.preventDefault();
            if(validateSearch(searchField, searchOperator, searchValue)){
                $(this).hide();
                searchValue.siblings('.btn.resetHandle').show();
                callback(getSearch(searchField, searchOperator, searchValue));
            }
        });
        searchValue.siblings('.btn.resetHandle').on('click', function(e){
            e.preventDefault();
            searchValue.val('');
            hideError(searchValue);
            $(this).hide();
            searchValue.siblings('.btn.searchHandle').show();
            callback([]);
        });
	}

	function showError(el, msg){
		el.siblings('.error').html(msg);
	}

	function hideError(el){
		el.siblings('.error').html('');
	}

	function validateSearch(searchField, searchOperator, searchValue){

        if($.trim(searchField.val()).length == 0){
            showError(searchValue, 'Missing search field.');
            return false;
        }
        if($.trim(searchOperator.val()).length == 0){
            showError(searchValue, 'Missing search operator.');
            return false;
        }
        if($.trim(searchValue.val()).length == 0){
            showError(searchValue, 'Missing search value.');
            return false;
        }
        return true;
    }

	function getSearch(searchField, searchOperator, searchValue){
        var searchTerm = searchValue.val();
        var result = [];

        if(searchTerm.length > 0){

            switch(searchOperator.val()){
                case 'begins-with': case 'does-not-begin-with': {
                    searchTerm =  searchTerm + '%';
                    break;
                }
                case 'ends-with': case 'does-not-end-with': {
                    searchTerm = '%' + searchTerm;
                    break;
                }
                case 'contains': case 'does-not-contain': {
                    searchTerm = '%' + searchTerm + '%';
                    break;
                }
            }

            result = [searchField.val(), searchOperator.find('option:selected').data('operator'), searchTerm];
        }

        return result
    }

	// set reference back
	syboo.utils = utils;
	window.syboo = syboo;
});