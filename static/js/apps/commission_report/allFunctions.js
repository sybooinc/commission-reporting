define([
    'jquery'
    , 'underscore'
    , 'handlebars'
    , 'moment'
    , 'accounting'
    , 'async'
    , 'jqueryxml2json'
    , 'jqueryDatatable'
    , 'jquery.dataTables.grouping'
],function($, _, Handlebars, moment, accounting, Async){

    var syboo = window.syboo || {};

    syboo.grid = {};
    syboo.grid.filterOperators = {
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
    syboo.gridVariables = {
        pageNbr: 1
        , rowsPerPage: 50
        , pagingCookie: ''
        , columns: {
            'syboo_payee_trade_date': {name: 'tradeDate'}
            , 'syboo_name': {name: 'ticketNbr'}
            , 'syboo_payee_cus_search_id': {name: 'customer'}
            , 'syboo_product': {name: 'product'}
            , 'syboo_payee_inv_amt': {name: 'investment'}
            , 'syboo_payee_cnc_amt': {name: 'concession'}
            , 'syboo_payee_rate': {name: 'rate'}
            , 'syboo_payee_amt': {name: 'amountPaid'}
        }
        , dateRange: {operator: 'last-x-days', value: 30}
        , orderByDescending: true
        , orderByColumn: 'syboo_payee_amt'
        , searchFilter: ''
    }

    syboo.commissionsSummary = {};
    syboo.commissionsSummary.getCommissionRequest = function(startDate, endDate){
        return "<fetch distinct='false' mapping='logical' aggregate='true'>" +
                    '<entity name="syboo_transaction">' +
                    '<attribute name="syboo_payee_amt" aggregate="sum" alias="aggregatedAmount" />' +
                        '<filter type="and" >' +
                            '<condition attribute="ownerid" operator="eq-userteams" />' +
                            '<condition attribute="syboo_payee_prd_type" operator="ne" value="CFD" />' +
                            '<condition attribute="syboo_payee_prd_type" operator="ne" value="A~~" />' +
                            '<condition attribute="syboo_payee_prd_type" operator="ne" value="D~~" />' +
                            '<condition attribute="syboo_commissiontype" operator="eq" value="0" />' +
                            '<condition attribute="syboo_payee_cmm_date" operator="on-or-after" value="'+ startDate +'" />' +
                            '<condition attribute="syboo_payee_cmm_date" operator="on-or-before" value="'+ endDate +'" />' +
                        '</filter>' +
                    '</entity>' +
                '</fetch>';
    }
    syboo.commissionsSummary.getOverridesRequest = function(startDate, endDate){
        return "<fetch distinct='false' mapping='logical' aggregate='true'>" +
                    '<entity name="syboo_transaction">' +
                    '<attribute name="syboo_payee_amt" aggregate="sum" alias="aggregatedAmount" />' +
                        '<filter type="and" >' +
                            '<condition attribute="ownerid" operator="eq-userteams" />' +
                            '<condition attribute="syboo_payee_prd_type" operator="ne" value="CFD" />' +
                            '<condition attribute="syboo_payee_prd_type" operator="ne" value="A~~" />' +
                            '<condition attribute="syboo_payee_prd_type" operator="ne" value="D~~" />' +
                            '<condition attribute="syboo_commissiontype" operator="eq" value="1" />' +
                            '<condition attribute="syboo_payee_cmm_date" operator="on-or-after" value="'+ startDate +'" />' +
                            '<condition attribute="syboo_payee_cmm_date" operator="on-or-before" value="'+ endDate +'" />' +
                        '</filter>' +
                    '</entity>' +
                '</fetch>';
    }
    syboo.commissionsSummary.getAdjustmentsAndDeductionsRequest = function(startDate, endDate){
        return "<fetch distinct='false' mapping='logical' aggregate='true'>" +
                    '<entity name="syboo_transaction">' +
                    '<attribute name="syboo_payee_amt" aggregate="sum" alias="aggregatedAmount" />' +
                        '<filter type="and" >' +
                            '<condition attribute="ownerid" operator="eq-userteams" />' +
                            '<condition attribute="syboo_payee_cmm_date" operator="on-or-after" value="'+ startDate +'" />' +
                            '<condition attribute="syboo_payee_cmm_date" operator="on-or-before" value="'+ endDate +'" />' +
                        '</filter>' +
                        '<filter type="or" >' +
                            '<condition attribute="syboo_payee_prd_type" operator="eq" value="CFD" />' +
                            '<condition attribute="syboo_payee_prd_type" operator="eq" value="A~~" />' +
                            '<condition attribute="syboo_payee_prd_type" operator="eq" value="D~~" />' +
                        '</filter>' +
                    '</entity>' +
                '</fetch>';
    }
    syboo.commissionsSummary.getAggregate = function(data){
        var returnData = '';

        if(data.KeyValuePairOfstringanyType.key == 'EntityCollection'){
            var entities = data.KeyValuePairOfstringanyType.value.Entities;
            var entityData = entities.Entity.Attributes.KeyValuePairOfstringanyType;
            console.log('entityData', entityData)
            if(!_.isUndefined(entityData) && entityData.key == 'aggregatedAmount'){
                returnData = entityData.value.Value.Value;
            }
        }
        return Number(returnData);
    }
    syboo.commissionsSummary.getData = function(gross, credit, debit){
        var data = { gross: {}, debit: {}, credit: {}, net: {} }
            , net = gross + credit + debit;
        data.gross.isNegative = (gross < 0 ? 'negative' : ''); 
        data.credit.isNegative = (credit < 0 ? 'negative' : '');
        data.debit.isNegative = (debit < 0 ? 'negative' : '');
        data.net.isNegative = (net < 0 ? 'negative' : '');

        data.gross.amount = syboo.utils.dollarAndCentsAmount(gross, true, false, false, false);
        data.credit.amount = syboo.utils.dollarAndCentsAmount(credit, true, false, false, false);
        data.debit.amount = syboo.utils.dollarAndCentsAmount(debit, true, false, false, false);
        data.net.amount = syboo.utils.dollarAndCentsAmount(net, true, false, false, false);
        return data;
    }

    syboo.utils.GridSearch = {};

    syboo.utils.GridSearch.init = function(searchBox, searchTags, callback){
        if(_.isUndefined(searchBox) || _.isUndefined(searchTags))
            return;

        var searchOperators = ['begins-with', 'does-not-begin-with', 'ends-with', 'does-not-end-with', 'contains', 'does-not-contain', '=', '>=', '<=', '>', '<', '!='];

        function split( val ) {
          return val.split( ' ' );
        }
        function extractLast( term ) {
          return split( term ).pop();
        }
        function validateSearch(){
            var searchPhrase = searchBox.val();

            if(searchPhrase.length > 0){
                var terms = split(searchPhrase);
                var msg = 'Invalid search. Please choose from the list.'

                if(_.isUndefined(terms[0])){
                    showError('Missing search column.');
                    return;
                }else if(!_.contains(searchTags, terms[0])){
                    showError('Please choose a search column from the list.');
                    return;
                }else if(_.isUndefined(terms[1])){
                    showError('Missing search operator.');
                    return;
                }else if(!_.contains(searchOperators, terms[1])){
                    showError('Please choose a search operator from the list.');
                    return;
                }

                var searchTerm = terms.slice(2).join(' ');
                if($.trim(searchTerm).length == 0){
                    showError('Missing search value.');
                    return;
                }
                return true;
            }
            return false;
        }
        function showError(msg){
            searchBox.parent().addClass('error');
            searchBox.parent().parent().find('.searchError').html(msg);
        }
        function clearError(){
            searchBox.parent().removeClass('error');
            searchBox.parent().parent().find('.searchError').html('');
        }
        function getSearch(){
            var searchPhrase = searchBox.val();
            var result = [];

            if(searchPhrase.length > 0){
                var terms = split(searchPhrase);
                var searchTerm = terms.slice(2).join(' ');

                switch(terms[1]){
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

                result = [terms[0], terms[1], searchTerm];
            }

            return result
        }
     
        searchBox
          // don't navigate away from the field on tab when selecting an item
          .bind( "keydown", function( event ) {
            clearError();
            if ( event.keyCode === $.ui.keyCode.TAB &&
                $( this ).data( "ui-autocomplete" ).menu.active ) {
              event.preventDefault();
            }
            if ( event.keyCode === $.ui.keyCode.ENTER && !($(this).data( "ui-autocomplete" ).menu.active)) {
                searchBox.autocomplete('close');
                searchBox.siblings('.btn.searchHandle').trigger('click');
            }
          })
          .autocomplete({
            minLength: 0,
            autoFocus: true,
            source: function( request, response ) {
                var state = split(request.term).length;
                // delegate back to autocomplete, but extract the last term
                switch(state){
                    case 1: {
                        $('.ui-autocomplete').removeClass('helpState');
                        response( $.ui.autocomplete.filter(
                            searchTags, extractLast( request.term ) ) );
                        break;
                    }
                    case 2: {
                        $('.ui-autocomplete').removeClass('helpState');
                        response( $.ui.autocomplete.filter(
                            searchOperators, extractLast( request.term ) ) );
                        break;
                    }
                    /*case 3: {
                        //$('.ui-autocomplete').addClass('helpState');
                        //response(['Provide the value to search for']);
                        break;
                    }
                    default: {
                        $('.ui-autocomplete').addClass('helpState');
                        response(['eg: product like franklin']);
                    }*/
                }

            },
            focus: function() {
                // prevent value inserted on focus
                return false;
            },
            select: function( event, ui ) {
                var terms = split( this.value );
                // remove the current input
                terms.pop();
                // add the selected item
                terms.push( ui.item.value );
                // add placeholder to get the comma-and-space at the end after choosing the operator
                //terms.push( "" );
                this.value = terms.join( " " );
                return false;
            },
            search: function(){
                syboo.gridVariables.searchColumn = '';
            }
          });
        searchBox.focus(function(){
            if ($(this).val() == "")
                $(this).keydown();
            return false;
        });
        searchBox.siblings('.btn.searchHandle').on('click', function(e){
            e.preventDefault();
            if(validateSearch()){
                $(this).hide();
                searchBox.siblings('.btn.resetHandle').show();
                callback(getSearch());
            }
        });
        searchBox.siblings('.btn.resetHandle').on('click', function(e){
            e.preventDefault();
            searchBox.val('');
            clearError();
            $(this).hide();
            searchBox.siblings('.btn.searchHandle').show();
            callback([]);
        });
    }

    syboo.initSummary = function(){

        var today = moment().format('MM/DD/YYYY')
            , startOfYear = moment().startOf('year').format('MM/DD/YYYY')
            , pendingStartDate = moment('01/01/1900').format('MM/DD/YYYY')
            , pendingEndDate = moment('01/01/1901').format('MM/DD/YYYY');

        Async.parallel({
            grossCommissionLast: function(callback){
                syboo.utils.fetchData(syboo.commissionsSummary.getCommissionRequest('10/10/2013', '10/10/2013'), function(data){
                    callback(null, data);
                });
            }
            , overridesLast: function(callback){
                syboo.utils.fetchData(syboo.commissionsSummary.getOverridesRequest('10/10/2013', '10/10/2013'), function(data){
                    callback(null, data);
                });
            }
            , adjustmentsAndDeductionsLast: function(callback){
                syboo.utils.fetchData(syboo.commissionsSummary.getAdjustmentsAndDeductionsRequest('10/10/2013', '10/10/2013'), function(data){
                    callback(null, data);
                });
            }
            , grossCommissionYTD: function(callback){
                syboo.utils.fetchData(syboo.commissionsSummary.getCommissionRequest(startOfYear, today), function(data){
                    callback(null, data);
                });
            }
            , overridesYTD: function(callback){
                syboo.utils.fetchData(syboo.commissionsSummary.getOverridesRequest(startOfYear, today), function(data){
                    callback(null, data);
                });
            }
            , adjustmentsAndDeductionsYTD: function(callback){
                syboo.utils.fetchData(syboo.commissionsSummary.getAdjustmentsAndDeductionsRequest(startOfYear, today), function(data){
                    callback(null, data);
                });
            }
            , grossCommissionPending: function(callback){
                syboo.utils.fetchData(syboo.commissionsSummary.getCommissionRequest(pendingStartDate, pendingEndDate), function(data){
                    callback(null, data);
                });
            }
            , overridesPending: function(callback){
                syboo.utils.fetchData(syboo.commissionsSummary.getOverridesRequest(pendingStartDate, pendingEndDate), function(data){
                    callback(null, data);
                });
            }
            , adjustmentsAndDeductionsPending: function(callback){
                syboo.utils.fetchData(syboo.commissionsSummary.getAdjustmentsAndDeductionsRequest(pendingStartDate, pendingEndDate), function(data){
                    callback(null, data);
                });
            }
        }, function(err, results){
            console.log('response', err, results)
            var data = {};
            
            data.last = syboo.commissionsSummary.getData(
                syboo.commissionsSummary.getAggregate(results.grossCommissionLast.Body.ExecuteResponse.ExecuteResult.Results)
                , syboo.commissionsSummary.getAggregate(results.overridesLast.Body.ExecuteResponse.ExecuteResult.Results)
                , syboo.commissionsSummary.getAggregate(results.adjustmentsAndDeductionsLast.Body.ExecuteResponse.ExecuteResult.Results)
            );

            data.ytd = syboo.commissionsSummary.getData(
                syboo.commissionsSummary.getAggregate(results.grossCommissionYTD.Body.ExecuteResponse.ExecuteResult.Results)
                , syboo.commissionsSummary.getAggregate(results.overridesYTD.Body.ExecuteResponse.ExecuteResult.Results)
                , syboo.commissionsSummary.getAggregate(results.adjustmentsAndDeductionsYTD.Body.ExecuteResponse.ExecuteResult.Results)
            );

            data.pending = syboo.commissionsSummary.getData(
                syboo.commissionsSummary.getAggregate(results.grossCommissionPending.Body.ExecuteResponse.ExecuteResult.Results)
                , syboo.commissionsSummary.getAggregate(results.overridesPending.Body.ExecuteResponse.ExecuteResult.Results)
                , syboo.commissionsSummary.getAggregate(results.adjustmentsAndDeductionsPending.Body.ExecuteResponse.ExecuteResult.Results)
            );


            var el = $('#summary');
            el.html( Handlebars.compile( $("#template-commission-summary").html() )( data ) );
            el.removeClass('loading');
        });
    }
    syboo.initGrid = function(){
        var columns = _.keys(syboo.gridVariables.columns);
        var columnNames = _.map(syboo.gridVariables.columns, function(column){
            return column.name;
        })

        syboo.myDataTable = $('#example').dataTable( {
                //"aaData": rowsData,
                "aoColumns": [
                    { "sTitle": "<span data-col-name='syboo_payee_trade_date'>Trade Date</span>", "sClass": "alignLeft tradeDate", "sWidth": "100px" },
                    { "sTitle": "<span data-col-name='syboo_name'>Ticket No.</span>", "sClass": "alignLeft ticketNbr" },
                    { "sTitle": "<span data-col-name='syboo_payee_cus_search_id'>Customer</span>", "sClass": "alignLeft customer" },
                    { "sTitle": "<span data-col-name='syboo_product'>Product</span>", "sClass": "alignLeft product" },
                    { "sTitle": "<span data-col-name='syboo_payee_inv_amt'>Investment</span>", "sClass": "alignRight investment" },
                    { "sTitle": "<span data-col-name='syboo_payee_cnc_amt'>Dealer Consession</span>", "sClass": "alignRight concession" },
                    { "sTitle": "<span data-col-name='syboo_payee_rate'>Payout</span>", "sClass": "alignRight rate" },
                    { "sTitle": "<span data-col-name='syboo_payee_amt'>Rep Commission</span>", "sClass": "alignRight amountPaid" }
                ],
                "bSort": false,
                "bPaginate": false,
                "bScrollCollapse": true,
                "bFilter": false,
                "bLengthChange": false,
                "bInfo": false,
                "aaSorting": [[ 7, "desc" ]],
                "bDestroy": true
                //"sPaginationType": "full_numbers",
                //"iDisplayLength": 50
        } );

        if(!_.isUndefined(syboo.gridVariables.orderByColumn) && syboo.gridVariables.orderByColumn.length > 0){
            $('th.sorting_disabled>span[data-col-name="'+ syboo.gridVariables.orderByColumn +'"]').parent().addClass('sorting_desc');
        }

        // initialize sorting
        $(document).on('click', 'th.sorting_disabled', syboo.sortColumns);

        // initialize pagination
        $('.pagination .button').click(function(e){
            e.preventDefault();
            var el = $(e.currentTarget);
            if(!el.hasClass('active')){
                return;
            }
            if(el.hasClass('next')){
                syboo.gridVariables.pageNbr++;
                $('.pagination .button.previous').addClass('active');
            }else if(el.hasClass('previous')){
                syboo.gridVariables.pageNbr--;
                if(syboo.gridVariables.pageNbr <= 1){
                    $('.pagination .button.previous').removeClass('active');
                }
            }
            if(_.isNumber(syboo.gridVariables.pageCount)){
                $('.pagination .label').html('Page ' + syboo.gridVariables.pageNbr + ' of ' + syboo.gridVariables.pageCount);
            }else{
                $('.pagination .label').html('Page ' + syboo.gridVariables.pageNbr);
            }
            syboo.getGridRecords();
        });

        // initialize search
        syboo.utils.GridSearch.init($('.searchBox'), columnNames, syboo.grid.search);

        // adjustments, deductions and others table
        syboo.incomeDetailsTable = $('.incomeDetails table').dataTable( {
                //"aaData": rowsData,
                "aoColumns": [
                    { "sTitle": "<span data-col-name='syboo_payee_prd_type'>Type</span>", "sClass": "alignLeft product" },
                    { "sTitle": "<span data-col-name='syboo_product'>Description</span>", "sClass": "alignLeft product" },
                    { "sTitle": "<span data-col-name='syboo_payee_amt'>Amount</span>", "sClass": "alignRight amountPaid" }
                ],
                "bSort": false,
                "bPaginate": false,
                "bScrollCollapse": true,
                "bFilter": false,
                "bLengthChange": false,
                "bInfo": false,
                "bDestroy": true
                //"sPaginationType": "full_numbers",
                //"iDisplayLength": 50
        } ).rowGrouping({bExpandableGrouping: true});
    }

    syboo.grid.search = function(searchAry){
        if(searchAry.length <= 0){
            // clear search
            syboo.gridVariables.searchFilter = '';
        }else{
            var searchColumnName = searchAry[0];
            var searchColumn;
            _.each(syboo.gridVariables.columns, function(column, key){
                if(column.name == searchColumnName){
                    searchColumn = key;
                }
            });
            // exception
            if(searchColumn == 'syboo_product'){
                searchColumn = 'syboo_productname';
            }

            var searchOperator = syboo.grid.filterOperators[searchAry[1]];
            var searchTerm = searchAry[2];

            if(_.isUndefined(searchColumn) || _.isUndefined(searchOperator) || _.isUndefined(searchTerm)){
                console.log('search error', searchAry);
                //alert('invalid search');
                $('.searchBox').parent().addClass('error');
                $('.searchBox').parent().parent().find('.searchError').html('Invalid search. Please choose search params from list.');
                return;
            }
            syboo.gridVariables.searchFilter = '<condition attribute="'+ searchColumn +'" operator="'+ searchOperator +'" value="'+ searchTerm +'"/>';
        }
        syboo.getGridData();
    }

    syboo.sortColumns = function(e){
        $(document).off('click', 'th.sorting_disabled', syboo.sortColumns);

        var el = $(e.currentTarget)
            , spanEl = el.find('span');

        el.siblings().removeClass('sorting_asc');
        el.siblings().removeClass('sorting_desc');

        if(el.hasClass('sorting_desc')){
            el
                .removeClass('sorting_desc')
                .addClass('sorting_asc');
            syboo.gridVariables.orderByDescending = false;
        }else{
            el
                .removeClass('sorting_asc')
                .addClass('sorting_desc');
            syboo.gridVariables.orderByDescending = true;
        }

        syboo.gridVariables.orderByColumn = spanEl.data('col-name');
        syboo.getGridRecords();

        $(document).on('click', 'th.sorting_disabled', syboo.sortColumns);
    }

    syboo.getGridPageCount = function(callback){
        var fetchPageCountRequest = "<fetch distinct='false' mapping='logical' aggregate='true'>" +
                                '<entity name="syboo_transaction">' +
                                    '<attribute name="syboo_transactionid" aggregate="countcolumn" alias="recordCount" />' +
                                    '<filter type="and">' +
                                        '<condition attribute="ownerid" operator="eq-userteams" />' +
                                        syboo.getDateFilter() +
                                        syboo.getSearchFilter() +
                                        syboo.getProductFilter() +
                                    '</filter>' +
                                '</entity>' +
                            '</fetch>';

        console.log('fetchPageCountRequest', fetchPageCountRequest);
        syboo.utils.fetchData(fetchPageCountRequest, function(data){
            var rowsData = []
                , results = data.Body.ExecuteResponse.ExecuteResult.Results;
            if(results.KeyValuePairOfstringanyType.key == 'EntityCollection'){
                var entities = results.KeyValuePairOfstringanyType.value.Entities;
                var entityData = entities.Entity.Attributes.KeyValuePairOfstringanyType;
                if(entityData.key == 'recordCount'){
                    var recordCount = entityData.value.Value.text;
                    syboo.gridVariables.pageCount = Math.ceil(recordCount / syboo.gridVariables.rowsPerPage);
                    if(_.isNumber(syboo.gridVariables.pageCount)){
                        $('.pagination .label').html('Page ' + syboo.gridVariables.pageNbr + ' of ' + syboo.gridVariables.pageCount);
                    }
                }
            }
            if(typeof callback == 'function'){
                callback();
            }
        });
    }

    syboo.getGridData = function(){
        syboo.getGridPageCount(syboo.getGridRecords);
    }

    syboo.getGridRecords = function(){
        $('.gridFrame .overlay').show();

        var pageNbr = syboo.gridVariables.pageNbr
            , rowsPerPage = syboo.gridVariables.rowsPerPage
            , pagingCookie = syboo.gridVariables.pagingCookie
            , columns = _.keys(syboo.gridVariables.columns)
            , columnStr = [];

        _.each(columns, function(col){
            columnStr.push("<attribute name='" + col + "' />");
        });

        if(pageNbr == 1){
            pagingCookie = '';
        }
        var fetchRequest = "<fetch distinct='false' mapping='logical' page='"+ pageNbr +"' count='"+ rowsPerPage +"' pagingCookie='"+ pagingCookie +"'>" +
                                '<entity name="syboo_transaction">' +
                                    columnStr.join('') +
                                    syboo.getOrderBy() +
                                    '<filter type="and">' +
                                        '<condition attribute="ownerid" operator="eq-userteams" />' +
                                        syboo.getDateFilter() +
                                        syboo.getSearchFilter() +
                                        syboo.getProductFilter() +
                                    '</filter>' +
                                '</entity>' +
                            '</fetch>';

        console.log('fetchRequest', fetchRequest)

        

        syboo.utils.fetchData(fetchRequest, function(data){
            var rowsData = []
                , results = data.Body.ExecuteResponse.ExecuteResult.Results;

            if(results.KeyValuePairOfstringanyType.key == 'EntityCollection'){
                var entities = results.KeyValuePairOfstringanyType.value.Entities;
                var entityData = entities.Entity;
                _.each(entityData, function(entity){
                    if(!_.isUndefined(entity.Attributes)){
                        var kvData = entity.Attributes.KeyValuePairOfstringanyType;
                        var formattedKVData = entity.FormattedValues.KeyValuePairOfstringstring;
                        var rowData = [];
                        _.each(columns, function(col){
                            var colData = _.find(formattedKVData, function(fd){
                                return fd.key == col;
                                });
                            if(_.isUndefined(colData)){
                                colData = _.find(kvData, function(d){
                                    return d.key == col;
                                });
                            }
                            if(!_.isUndefined(colData)){
                                var key = colData.key
                                    , val;
                                if(!_.isUndefined(colData.value.Name)){
                                    val = colData.value.Name;
                                }else{
                                    val = colData.value;
                                }
                                if(key == 'syboo_payee_rate'){
                                    val = Number(val * 100).toFixed(2) + '%';
                                }
                                rowData.push('<span title="'+ val +'">' + val + '</span>');
                            }else{
                                rowData.push('-');
                            }

                        });
                        rowsData.push(rowData);
                    }else{
                        console.log('failed entity', entity);
                    }
                });

                if(!_.isUndefined(results.KeyValuePairOfstringanyType.value.MoreRecords) && results.KeyValuePairOfstringanyType.value.MoreRecords == 'true'){
                    //syboo.gridVariables.pageNbr++;
                    syboo.gridVariables.pagingCookie = results.KeyValuePairOfstringanyType.value.PagingCookie.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    $('.pagination .button.next').addClass('active');
                }else{
                    $('.pagination .button.next').removeClass('active');
                }
            }

            syboo.myDataTable.fnClearTable();
            console.log('rowsData', rowsData)
            syboo.myDataTable.fnAddData(rowsData);

            $('.gridFrame .overlay').hide();
        });
    }



    syboo.renderVizualization = function(){
        if(_.isUndefined(syboo.productType)){
            syboo.renderVizualizationByProductType();
        }else{
            syboo.renderVizualizationByProduct(syboo.productType);
        }
    }

    syboo.renderVizualizationByProductType = function(){
        var allDeductions = ['D~~', 'A~~', 'CFD'];
        var vizFetchRequest = '<fetch distinct="false" mapping="logical" aggregate="true" >' +
                                '<entity name="syboo_transaction" >' +
                                    '<attribute name="syboo_payee_amt" aggregate="sum" alias="commission" />' +
                                    '<attribute name="syboo_payee_prd_type" alias="productType" groupby="true" />' +
                                    '<filter type="and" >' +
                                        '<condition attribute="ownerid" operator="eq-userteams" />' +
                                         syboo.getDateFilter() +
                                    '</filter>' +
                                '</entity>' +
                            '</fetch>';

        console.log('vizFetchRequest by productType', vizFetchRequest);

        syboo.utils.fetchData(vizFetchRequest, function(data){

            var results = data.Body.ExecuteResponse.ExecuteResult.Results;
            var aggData = [], aggTotal = 0, percentTotal = 0, deductions = {}, aggDeductions = 0;

            if(results.KeyValuePairOfstringanyType.key == 'EntityCollection'){
                var entities = results.KeyValuePairOfstringanyType.value.Entities;
                var entityData = entities.Entity;

                _.each(entityData, function(entity){
                    var kvData = entity.Attributes.KeyValuePairOfstringanyType;
                    var commData = _.find(kvData, function(fd){
                                    return fd.key == 'commission';
                                });
                    var productTypeData = _.find(kvData, function(fd){
                                    return fd.key == 'productType';
                                });

                    var productTypeValue = productTypeData.value.Value.text;

                    if(!_.contains(allDeductions, productTypeValue)){
                        var fa = syboo.utils.dollarAndCentsAmount(commData.value.Value.Value, true, true, false, false);
                        aggData.push({name: productTypeValue, id: productTypeValue, amount: Math.abs(Number(commData.value.Value.Value)), formattedAmount: fa});
                        aggTotal += Number(commData.value.Value.Value);
                        percentTotal += Math.abs(Number(commData.value.Value.Value));
                    }else{
                        deductions[productTypeValue] = {};
                        deductions[productTypeValue].name = syboo.getDeductionName(productTypeValue);
                        deductions[productTypeValue].amount = syboo.utils.dollarAndCentsAmount(commData.value.Value.Value, true, true, false, false);
                        aggDeductions += Math.abs(Number(commData.value.Value.Value));
                    }
                });
            }
            var netIncome = aggTotal - aggDeductions;
            
            $('.incomeSummary')
                .removeClass('active')
                .html(Handlebars.compile($("#template-summary").html())({deductions: deductions, netIncome: syboo.utils.dollarAndCentsAmount(netIncome, true, true, false, false), netIncomeSign: netIncome >= 0 ? 'positive' : 'negative'}));
            $('.incomeDetails').hide();    
            $('.incomeSummaryFrame').fadeIn();

            syboo.getAdjustmentsAndDeductionsDetail();

            var sortedAggData = _.sortBy(aggData, function(ad){
                return -ad.amount;
            });

            _.each(sortedAggData, function(ad){
                ad.percent = (Math.abs(Number(ad.amount)) / percentTotal) * 100;
            });

            $('#commissions .donut .labelAmount').html(syboo.utils.dollarAndCentsAmount(aggTotal, true, true, false, false));

            if(!_.isUndefined(syboo.commissionsDonut)){
                delete syboo.commissionsDonut;
            }

            syboo.commissionsDonut = new syboo.utils.Donut(Raphael($('#donutSVG')[0]), 160, 150, 112, 82, sortedAggData, true);
            syboo.commissionsDonut.aggTotal = aggTotal;

            syboo.utils.donutLegend.render(syboo.commissionsDonut.categories, $('#commissions .graphFrame'));
        });

        // render bar chart
        syboo.renderBarChart();

        // render YTD
        var vizFetchYTD = '<fetch distinct="false" mapping="logical" aggregate="true" >' +
                                '<entity name="syboo_transaction" >' +
                                    '<attribute name="syboo_payee_amt" aggregate="sum" alias="commission" />' +
                                    '<filter type="and" >' +
                                        '<condition attribute="ownerid" operator="eq-userteams" />' +
                                        "<condition attribute='syboo_payee_cmm_date'  operator='this-year' value='1' />" +
                                    '</filter>' +
                                '</entity>' +
                            '</fetch>';

        syboo.utils.fetchData(vizFetchYTD, function(data){

            var results = data.Body.ExecuteResponse.ExecuteResult.Results;
            if(results.KeyValuePairOfstringanyType.key == 'EntityCollection'){
                var entities = results.KeyValuePairOfstringanyType.value.Entities;
                var entityData = entities.Entity;

                var kvData = entityData.Attributes.KeyValuePairOfstringanyType;
                var commData = _.find(kvData, function(fd){
                                return fd.key == 'commission';
                            });
                 $('#commissions .ytdValue').html(syboo.utils.dollarAndCentsAmount(kvData.value.Value.Value, true, true, false, false));
            }
        });
    }

    syboo.getDeductionName = function(productType){
        switch(productType){
            case 'D~~':
                return 'Deductions';
            case 'A~~':
                return 'Adjustments';
            case 'CFD':
                return 'Carry Forward Deductions';
        }
        return '';
    }

    syboo.renderVizualizationByProduct = function(productType){
        $('.incomeSummaryFrame').fadeOut();
        var vizFetchRequest = '<fetch distinct="false" mapping="logical" aggregate="true" >' +
                                '<entity name="syboo_transaction" >' +
                                    '<attribute name="syboo_payee_amt" aggregate="sum" alias="commission" />' +
                                    '<attribute name="syboo_product" alias="product" groupby="true" />' +
                                    '<filter type="and" >' +
                                        '<condition attribute="ownerid" operator="eq-userteams" />' +
                                        syboo.getDateFilter() +
                                        syboo.getProductFilter() +
                                    '</filter>' +
                                '</entity>' +
                            '</fetch>';
        console.log('vizFetchRequest by product', vizFetchRequest);
        syboo.utils.fetchData(vizFetchRequest, function(data){

            var results = data.Body.ExecuteResponse.ExecuteResult.Results;
            var aggData = [], aggTotal = 0, percentTotal = 0;

            if(results.KeyValuePairOfstringanyType.key == 'EntityCollection'){
                var entities = results.KeyValuePairOfstringanyType.value.Entities;
                var entityData = _.isArray(entities.Entity) ? entities.Entity : [entities.Entity];

                console.log('entityData', entityData)
                _.each(entityData, function(entity){
                    var kvData = entity.Attributes.KeyValuePairOfstringanyType;
                    var commData = _.find(kvData, function(fd){
                                    return fd.key == 'commission';
                                });
                    var productData = _.find(kvData, function(fd){
                                    return fd.key == 'product_syboo_productname';
                                });
                    if(!_.isUndefined(commData) && !_.isUndefined(productData)){
                        var fa = syboo.utils.dollarAndCentsAmount(commData.value.Value.Value, true, true, false, false);
                        aggData.push({name: productData.value.Value, id: productData.value.Value, amount: Math.abs(Number(commData.value.Value.Value)), formattedAmount: fa});
                        aggTotal += Number(commData.value.Value.Value);
                        percentTotal += Math.abs(Number(commData.value.Value.Value));
                    }else{
                        console.log('missing commData or productData', commData, productData);
                    }
                });
            }

            var sortedAggData = _.sortBy(aggData, function(ad){
                return -ad.amount;
            });

            _.each(sortedAggData, function(ad){
                ad.percent = (Math.abs(Number(ad.amount)) / percentTotal) * 100;
            });

            $('#commissions .donut .labelAmount').html(syboo.utils.dollarAndCentsAmount(aggTotal, true, true, false, false));

            if(!_.isUndefined(syboo.commissionsDonut)){
                delete syboo.commissionsDonut;
            }
            $('#donutSVG').html('');
            syboo.commissionsDonut = new syboo.utils.Donut(Raphael($('#donutSVG')[0]), 160, 150, 112, 82, sortedAggData, false);
            syboo.commissionsDonut.aggTotal = aggTotal;

            syboo.utils.donutLegend.render(syboo.commissionsDonut.categories, $('#commissions .graphFrame'));
        });

        // render bar chart
        syboo.renderBarChart();

        // render YTD
        var vizFetchYTD = '<fetch distinct="false" mapping="logical" aggregate="true" >' +
                                '<entity name="syboo_transaction" >' +
                                    '<attribute name="syboo_payee_amt" aggregate="sum" alias="commission" />' +
                                    '<filter type="and" >' +
                                        '<condition attribute="ownerid" operator="eq-userteams" />' +
                                        "<condition attribute='syboo_payee_cmm_date'  operator='this-year' value='1' />" +
                                        syboo.getProductFilter() +
                                    '</filter>' +
                                '</entity>' +
                            '</fetch>';

        syboo.utils.fetchData(vizFetchYTD, function(data){

            var results = data.Body.ExecuteResponse.ExecuteResult.Results;
            if(results.KeyValuePairOfstringanyType.key == 'EntityCollection'){
                var entities = results.KeyValuePairOfstringanyType.value.Entities;
                var entityData = entities.Entity;

                var kvData = entityData.Attributes.KeyValuePairOfstringanyType;
                var commData = _.find(kvData, function(fd){
                                return fd.key == 'commission';
                            });
                 $('#commissions .ytdValue').html(syboo.utils.dollarAndCentsAmount(kvData.value.Value.Value, true, true, false, false));
            }
        });
    }

    syboo.onSliceMouseover = function (sliceId) {
        var self = this;
        var categories = syboo.commissionsDonut.categories;
        var slice = _.find(categories, function(category){
            return category.sliceId == sliceId;
        });
        if(!_.isUndefined(slice)){
            $('#commissions .donut .labelName').html(slice.name);
            $('#commissions .donut .labelAmount').html(slice.formattedAmount);
        }
    }

    syboo.onDonutMouseout = function(){
        $('#commissions .donut .labelName').html('Commission');
        $('#commissions .donut .labelAmount').html(syboo.utils.dollarAndCentsAmount(syboo.commissionsDonut.aggTotal, true, true, false, false));
    }

    syboo.renderBarChart = function(){
        $('#barChart').html('').addClass('loading');
        syboo.commissionBarChart = Raphael('barChart');
        syboo.commissionBarChart.clear();

        var barFetchRequest = '<fetch distinct="false" mapping="logical" aggregate="true" >' +
                                '<entity name="syboo_transaction" >' +
                                    '<attribute name="syboo_payee_amt" aggregate="sum" alias="commission" />' +
                                    '<attribute name="syboo_payee_cmm_date_year" alias="year" groupby="true" />' +
                                    '<attribute name="syboo_payee_cmm_date_month" alias="month" groupby="true" />' +
                                    '<filter type="and" >' +
                                        '<condition attribute="ownerid" operator="eq-userteams" />' +
                                        '<condition attribute="syboo_payee_cmm_date"  operator="last-x-years" value="2" />' +
                                        syboo.getProductFilter() +
                                    '</filter>' +
                                '</entity>' +
                            '</fetch>';

        console.log('barFetchRequest', barFetchRequest)                            
        syboo.utils.fetchData(barFetchRequest, function(data){

            var results = data.Body.ExecuteResponse.ExecuteResult.Results;

            if(results.KeyValuePairOfstringanyType.key == 'EntityCollection'){
                var entities = results.KeyValuePairOfstringanyType.value.Entities;
                var entityData = entities.Entity;

                var barData = [];
                _.each(entityData, function(entity){
                    var kvData = entity.Attributes.KeyValuePairOfstringanyType;
                    var commData = _.find(kvData, function(fd){
                                    return fd.key == 'commission';
                                });
                    var yearData = _.find(kvData, function(fd){
                                    return fd.key == 'year';
                                });
                    var monthData = _.find(kvData, function(fd){
                                    return fd.key == 'month';
                                });
                    var fa = syboo.utils.dollarAndCentsAmount(commData.value.Value.Value, true, true, false, false);
                    barData.push({year: yearData.value.Value, month: monthData.value.Value, amount: commData.value.Value.Value, formattedAmount: fa});
                });

                var thisYearData = _.filter(barData, function(d){
                    return d.year == new Date().getFullYear();
                });
                var thisYearSortedData = _.sortBy(thisYearData, function(d){
                    return d.month;
                });
                var thisYearCommission = _.map(thisYearSortedData, function(d){
                   return Number(d.amount);
                });

                if(thisYearCommission.length < 12){
                    var remaining = 12 - thisYearCommission.length;
                    for(var i = 0; i < remaining; i++){
                        thisYearCommission.push(0);
                    }
                }

                var lastYearData = _.filter(barData, function(d){
                    return d.year == new Date().getFullYear() - 1;
                });
                var lastYearSortedData = _.sortBy(lastYearData, function(d){
                    return d.month;
                });
                var lastYearCommission = _.map(lastYearSortedData, function(d){
                    return Number(d.amount);
                });

                var thisAndLastYear = thisYearCommission.concat(lastYearCommission)
                , minMax = {min: 0, max: _.max(thisAndLastYear)};

                
                syboo.commissionBarChart.drawGrid({
                    min : minMax.min
                    , max : minMax.max
                    , topPadding : 0.1
                    , bottomPadding : 0.1
                    , hideLabels : false
                    , rightPadding: 40
                    , xLabels: ['', 'Feb', '', 'Apr', '', 'Jun', '', 'Aug', '', 'Oct', '', 'Dec']
                    , container: 'barChart'
                })
                .drawBarSeries({
                    series : lastYearCommission
                    , type : 'noisyArea'
                    , color: '#F25100'
                    , hoverTips: {
                        show: true,
                        formatter: function(val){
                            return accounting.formatMoney(val);
                        }
                    }
                    , width: 0.3
                    , shiftX : -0.15
                })
                .drawBarSeries({
                    series : thisYearCommission
                    , type : 'noisyArea'
                    , color: '#0088CC'
                    , hoverTips: {
                        show: true,
                        formatter: function(val){
                            return accounting.formatMoney(val);
                        }
                    }
                    , width: 0.3
                    , shiftX : 0.15
                })
                .drawBaseline();
            }
            $('#barChart').removeClass('loading');
        });

    }

    syboo.fetchUserData = function(callback){
        var fetchUserRequest = '<fetch distinct="false" mapping="logical" >' +
                                '<entity name="team" >' +
                                    '<attribute name="name" />' +
                                    '<attribute name="teamid" />' +
                                    '<order attribute="name" descending="false" />' +
                                    '<filter type="and" >' +
                                        '<condition attribute="syboo_teamtype" operator="eq" value="944860000" />' +
                                    '</filter>' +
                                    '<link-entity name="teammembership" from="teamid" to="teamid" visible="false" intersect="true">' +
                                        '<link-entity name="systemuser" from="systemuserid" to="systemuserid" alias="ae">' +
                                            '<filter type="and">' +
                                                '<condition attribute="systemuserid" operator="eq-userid" />'+
                                            '</filter>' +
                                        '</link-entity>' +
                                    '</link-entity>' +
                                '</entity>' +
                            '</fetch>';



        syboo.utils.fetchData(fetchUserRequest, function(data){
            var results = data.Body.ExecuteResponse.ExecuteResult.Results;
            syboo.repNumbers = [];
            if(results.KeyValuePairOfstringanyType.key == 'EntityCollection'){
                var entities = results.KeyValuePairOfstringanyType.value.Entities;
                var entityData = entities.Entity;

                 _.each(entityData, function(entity){
                    if(!_.isUndefined(entity.Attributes)){
                        var kvData = entity.Attributes.KeyValuePairOfstringanyType;
                        var teamName = _.find(kvData, function(fd){
                                        return fd.key == 'name';
                                    });
                        syboo.repNumbers.push(teamName.value.text);
                    }else if(!_.isUndefined(entity.KeyValuePairOfstringanyType)){
                        var kvData = entity.KeyValuePairOfstringanyType;
                        var teamName = _.find(kvData, function(fd){
                                        return fd.key == 'name';
                                    });
                        syboo.repNumbers.push(teamName.value.text);
                    }
                });
            }
            if(syboo.repNumbers.length == 0){
                alert('There are no rep ids associated with this user. Please contact your branch office.');
                return;
            }
            if(typeof callback == 'function'){
                callback();
            }
        });
    }
    syboo.getAdjustmentsAndDeductionsDetail = function(){
        var fetchAdjustmentsAndDeductionsRequest = '<fetch distinct="false" mapping="logical" page="1" count="50" pagingCookie="" >' +
                            '<entity name="syboo_transaction" >' +
                                '<attribute name="syboo_payee_prd_type" />' +
                                '<attribute name="syboo_product" />' +
                                '<attribute name="syboo_payee_amt" />' +
                                '<order attribute="syboo_payee_prd_type"/>' +
                                '<order attribute="syboo_payee_amt" descending="true" />' +
                                '<filter type="and" >' +
                                    '<condition attribute="ownerid" operator="eq-userteams" />' +
                                    syboo.getDateFilter() +
                                '</filter>' +
                                '<filter type="or" >' +
                                    '<condition attribute="syboo_payee_prd_type" operator="eq" value="D~~" />' +
                                    '<condition attribute="syboo_payee_prd_type" operator="eq" value="A~~" />' +
                                    '<condition attribute="syboo_payee_prd_type" operator="eq" value="CFD" />' +
                                '</filter>' +
                            '</entity>' +
                        '</fetch>';

        console.log('fetchAdjustmentsAndDeductionsRequest', fetchAdjustmentsAndDeductionsRequest)

        syboo.utils.fetchData(fetchAdjustmentsAndDeductionsRequest, function(data){
            var rowsData = []
                , results = data.Body.ExecuteResponse.ExecuteResult.Results;

            if(results.KeyValuePairOfstringanyType.key == 'EntityCollection'){
                var entities = results.KeyValuePairOfstringanyType.value.Entities;
                var entityData = entities.Entity;
                var rowsData = [];
                _.each(entityData, function(entity){
                    if(!_.isUndefined(entity.Attributes)){
                        var kvData = entity.Attributes.KeyValuePairOfstringanyType;
                        var prdType = kvData[0].value;
                        var prdDesc = '<span title="'+ kvData[1].value.Name +'">' + kvData[1].value.Name + '</span>';
                        var prdAmt = syboo.utils.dollarAndCentsAmount(kvData[2].value.Value, true, true, true, false); ;
                        rowsData.push([prdType, prdDesc, prdAmt]);
                    }else{
                        console.log('failed entity', entity);
                    }
                });
            }

            console.log('rowsData', rowsData);

            syboo.incomeDetailsTable.fnClearTable();
            syboo.incomeDetailsTable.fnAddData(rowsData);
        });
    }

    syboo.getRepNumberFilter = function(){
        var filterAry = [];
        _.each(syboo.repNumbers, function(repNumber){
            filterAry.push('<condition attribute="syboo_payee_rep_no" operator="eq" value="' + repNumber + '" />');
        });
        return filterAry.join('');
    }

    syboo.getProductFilter = function(){
        if(_.isUndefined(syboo.productType)){
            return '';
        }
        return '<condition attribute="syboo_payee_prd_type"  operator="eq" value="'+ syboo.productType +'" />';
    }
    syboo.getDateFilter = function(){
        return '<condition attribute="syboo_payee_cmm_date"  operator="on-or-after" value="'+ syboo.startDate +'" /><condition attribute="syboo_payee_cmm_date"  operator="on-or-before" value="'+ syboo.endDate +'" />';
    }
    syboo.getSearchFilter = function(){
        console.log('getSearchFilter', syboo.gridVariables.searchFilter);
        return syboo.gridVariables.searchFilter;
    }
    syboo.getOrderBy = function(){
        if(!_.isUndefined(syboo.gridVariables.orderByColumn) && syboo.gridVariables.orderByColumn.length > 0){
            return '<order attribute="'+ syboo.gridVariables.orderByColumn +'" descending="'+ syboo.gridVariables.orderByDescending +'"/>';
        }else{
            return '';
        }
    }

    syboo.onProductTypeSelected = function(category){
        syboo.productType = category;
        $('#commissions .breadcrumb').html('<div class="links"><a href="#" class="allProductTypes">All Product Types</a></div><span>'+ category +'</span>');
        syboo.renderVizualizationByProduct(category);
        syboo.getGridData();
    }
    syboo.allProductTypesSelected = function(){
        delete syboo.productType;
        $('#commissions .breadcrumb').html('<span>All Product Types</span>');
        syboo.renderVizualizationByProductType();
        syboo.getGridData();
    }

    syboo.dateRangeUpdated = function(data){
        syboo.startDate = data.startDate;
        syboo.endDate = data.endDate;

        syboo.renderVizualization();

        syboo.gridVariables.pageNbr = 1;
        $('.pagination .button.previous').removeClass('active');
        $('.pagination .label').html('Page ' + syboo.gridVariables.pageNbr);
        syboo.getGridData();
    }

    window.syboo = syboo;
});