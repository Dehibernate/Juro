// Karma configuration
// Generated on Wed Mar 02 2016 19:20:59 GMT+0000 (GMT Standard Time)

module.exports = function (config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // list of files / patterns to load in the browser
    files: [
      //Third Party Libraries
      '../www/lib/ionic/js/ionic.bundle.min.js',
      '../www/lib/ng-superlogin/ng-superlogin.min.js',
      '../www/lib/angular-mocks/angular-mocks.js',
      '../www/lib/pouchdb/dist/pouchdb.min.js',
      '../www/lib/underscore/underscore-min.js',
      '../www/lib/angular-underscore-module/angular-underscore-module.js',
      '../www/lib/moment/min/moment.min.js',
      '../www/lib/angular-moment/angular-moment.min.js',

      //Application Specific
      '../www/src/app.js',
      '../www/src/controllers.js',
      '../www/src/authentication/authentication.controller.js',
      '../www/src/task-list/task-list.controllers.js',
      '../www/src/schedule-list/schedule-list.controller.js',
      '../www/src/settings/settings.controller.js',
      '../www/src/services/services.js',

      //Unit Tests
      'unit-tests/**/*.js'
    ],


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files to exclude
    exclude: [],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {},


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
};
