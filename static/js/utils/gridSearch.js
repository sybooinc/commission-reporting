(function(){
	// get reference
	var syboo = window.syboo || {}
		, utils = syboo.utils || {};

	utils.GridSearch = {};

	utils.GridSearch.init = function(){
		console.log('grid search init')
	}

	// set reference back
	syboo.utils = utils;
	window.syboo = syboo;
})();