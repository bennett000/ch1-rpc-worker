'use strict';

const webpack = require('webpack');
module.exports = (config) => {
  config.set({
    frameworks: [
      'jasmine',
      'source-map-support',
    ],

    files: ['./src/spec.entry.ts'],

    preprocessors: {
      './src/**/*.ts': [
        'webpack',
        'sourcemap',
      ],
      './src/**/!(*.test|tests.*).ts': [
        'coverage',
      ],
    },

    webpack: {
      plugins: [
        new webpack.NoErrorsPlugin(),
      ],
      entry: './src/tests.entry.ts',
      devtool: 'inline-source-map',
      verbose: true,
      resolve: {
        extensions: ['', '.webpack.js', '.web.js', '.ts', '.js'],
      },
      module: {
        loaders: [
          webpack.loaders.tsTest,
        ],
        postLoaders: [
          webpack.loaders.istanbulInstrumenter,
        ],
      },
      stats: { colors: true, reasons: true },
      debug: true,
    },

    webpackServer: {
      noInfo: true, // prevent console spamming when running in Karma!
    },

    reporters: [
      'spec',
      'coverage',
      'karma-remap-istanbul',
      'junit',
    ],
    coverageReporter: {
      reporters: [
        {
          type: 'text',
        },
        {
          type: 'json',
          subdir: '.',
          file: 'coverage-final.json',
        },
      ],
      dir: './coverage/',
      subdir: (browser) => {
        return browser.toLowerCase().split(/[ /-]/)[0]; // returns 'chrome'
      },
    },

    remapIstanbulReporter: {
      src: './coverage/coverage-final.json',
      reports: {
        html: './coverage/html'
      },
      timeoutNotCreated: 1000,
      timeoutNoMoreFiles: 1100
    },

    junitReporter: {
      outputFile: 'test-results.xml'
    },

    port: 9999,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS'], // Alternatively: 'PhantomJS'
    captureTimeout: 6000,
    singleRun: true,
  });
};
