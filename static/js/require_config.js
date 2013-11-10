define([], function () {
	require.config(
		{
			shim: {
				'backbone': {
					deps:    ['underscore', 'jquery']
					,exports: 'Backbone'
				}
				,'jqueryui': {
					deps:    ['jquery']
					, exports: 'jqueryui'
				}
				, 'jqueryDatatable' : {
					deps : ['jquery', 'jqueryui']
					, exports : 'dataTable'
				}
				,'underscore': {
					exports: '_'
				}
				,'raphael': {
					exports: 'Raphael'
				}
				, 'moment': {
				 	exports: 'moment'
				}
				, 'handlebars': {
				 	exports: 'Handlebars'
				}
			}
			, paths: {
				jquery						: 'vendor/jquery.1.9.1.min'
				, jqueryui						: 'vendor/jquery.ui.min'
				, jqueryDatatable				: 'vendor/jquery.dataTables.min'
				, jqueryxml2json				: 'vendor/jquery.xml2json'
				, underscore					: 'vendor/underscore.min'
				, raphael						: 'vendor/raphael.2.1.0.min'
				, backbone						: 'vendor/backbone.min'
				, moment						: 'vendor/moment.min'
				, accounting                    : 'vendor/accounting.min'
				, handlebars					: 'vendor/handlebars.1'
			}
		}
	);
});