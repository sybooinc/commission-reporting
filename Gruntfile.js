module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      files: ['Gruntfile.js', 'static/js/**/*.js'],
      options: {
        // options here to override JSHint defaults
        globals: {
          jQuery: true,
          console: true,
          module: true,
          document: true
        },
        laxcomma: true,
        laxbreak: true,
        smarttabs: true,
        asi: true,
        ignores: ['static/js/vendor/**/*.js']
      }
    },
    requirejs: {
      concat: {
        options: {
          // scripts dir that needs to be optimized
          baseUrl: 'static/js',
          // location of scripts dir to be copied after optimization
          dir: "static/dist/js",
          //JS file configuration to be read for the build
          mainConfigFile: 'static/js/require_config.js',
          modules: [
              { 
                  name: 'commission_report'
              }
          ],
          // remove files that have been combined during optimization
          removeCombined: true,
          optimizeCss: 'none',
          waitSeconds: 150,
          optimize: 'none',
        }
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['requirejs:concat']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-requirejs');

  grunt.registerTask('test', ['jshint']);
  grunt.registerTask('concat', ['requirejs:concat']);

  grunt.registerTask('default', ['jshint']);
};