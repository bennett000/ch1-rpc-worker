// Karma configuration
// Generated on Tue Feb 04 2014 21:57:25 GMT-0500 (EST)

module.exports = function (config) {
    config.set(
        {
            // export CHROME_BIN=/usr/bin/chromium-browser
            // base path, that will be used to resolve files and exclude
            basePath: '..',

            // frameworks to use
            frameworks: ['jasmine'],


            // list of files / patterns to load in the browser
            files: [
                'lib/workular/workular.min.js',
                'lib/q/q.js',
                'lib/browser-fake-promise/fake-promise.js',

                'src/remote-procedure.js',
                'src/js-rpc.js',

                'spec/mock*.js',
                'spec/*Spec.js',
                'spec/*spec.js'
            ],


            // list of files to exclude
            exclude: [
            ],


            // test results reporter to use
            // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
            reporters: ['progress', 'coverage'],


            // web server port
            port: 9876,


            // enable / disable colors in the output (reporters and logs)
            colors: true,


            // level of logging
            // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
            logLevel: config.LOG_INFO,


            // enable / disable watching file and executing tests whenever any file changes
            autoWatch: false,


            // Start these browsers, currently available:
            // - Chrome
            // - ChromeCanary
            // - Firefox
            // - Opera (has to be installed with `npm install karma-opera-launcher`)
            // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
            // - PhantomJS
            // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
            browsers: ['Firefox', 'PhantomJS'],//, 'Chrome'],


            // If browser does not capture in given timeout [ms], kill it
            captureTimeout: 60000,


            // Continuous Integration mode
            // if true, it capture browsers, run tests and exit
            singleRun: false,

            // coverage support
            preprocessors: {
                'src/*.js': ['coverage']
            }
        });
};
