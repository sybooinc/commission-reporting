define(['accounting'], function(accounting){

	// get reference
	var syboo = window.syboo || {}
	, utils = syboo.utils || {};

	// as Handlebar adds an "implicit object" to the function call,
	// we are filtering it out as a false value.
	// All other values are interpreted to true/false.
	function _pure(){
		return _.map(_.toArray(arguments),
			function(value){ return _.isObject(value) ? false : !!value; }
		);
	}

	utils.dollarAndCentsAmount = function(number, dash, includeCurrencySymbol, isNegative, noCents) {

		var out;
		var arg_array = _pure(dash, includeCurrencySymbol, isNegative, noCents);

		dash = arg_array[0];
		includeCurrencySymbol = arg_array[1];
		isNegative = arg_array[2];
		noCents = arg_array[3];

		var currencySymbol = "$";
		if(typeof includeCurrencySymbol == 'undefined' || !includeCurrencySymbol) {
			currencySymbol = '';
		}
		if((typeof number != 'undefined') && (number != 'NaN') && (!isNaN(number))){
			if(isNegative){
					number = -1 * number;
				}

				 out = accounting.formatMoney(number, {
					symbol: currencySymbol,
					precision: 2,
					thousand: ",",
					format: {
						pos : "%s%v",
						neg : "-%s%v",
						zero: "%s%v"
					}
				});

			if (noCents) out = out.replace(/\.\d\d/, '');

		}else{
			if (dash) {
				out = '-';
			} else {
				out = 'N/A';
			}
		}

		return out;
	}

	// set reference back
	syboo.utils = utils;
	window.syboo = syboo;
});