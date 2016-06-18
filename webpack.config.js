const path = require('path');
const webpack = require('webpack');

const loaders = {
  tslint: {
    test: /\.ts$/,
    loader: 'tslint',
    exclude: /node_modules/,
  },

  tsTest: loadTs('ts', true),
  istanbulInstrumenter: loadTs('istanbul-instrumenter'),
  ts: loadTs(),
};

module.exports = {
  devtool: 'source-map',
  entry: './src/index.ts',
  stats: {
    colors: true,
    reasons: true,
  },
  module: {
    preLoaders: [
      { test: /\.js$/, loader: 'eslint-loader' },
    ],
    loaders: [
      { test: /\.js$/, loader: 'ts-loader', exclude: /node_modules/ },
      { test: /\.ts$/, loader: 'ts-loader', exclude: /node_modules/ },
    ],
  },
  output: {
    path: path.join(__dirname, 'lib'),
    filename: 'js-rpc.js',
    publicPath: 'dist',
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false,
      },
    }),
  ],
  resolve: {
    extensions: ['', '.webpack.js', '.web.js', '.ts', '.js'],
  },
  devServer: {
    inline: true,
    colors: true,
  },
  loaders,
};

function loadTs(loader, inTest) {
  return {
    test: /\.ts$/,
    loader: loader || 'ts',
    exclude: inTest ? /node_modules/ :
      /(node_modules\/|\.test\.ts$|tests\.\w+\.ts$)/,
  };
}
