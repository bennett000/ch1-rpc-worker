const path = require('path');
const webpack = require('webpack');

const loaders = {
  tslint: {
    test: /\.ts$/,
    loader: 'tslint',
    exclude: /node_modules/,
  },

  tsTest: loadTs(null, true),
  istanbulInstrumenter: loadTs('istanbul-instrumenter'),
  ts: loadTs(),
};

const plugins = [
  new webpack.optimize.UglifyJsPlugin({
    compressor: {
      warnings: false,
    },
  }),
];

module.exports = {
  devtool: 'source-map',
  entry: {
    rpc: './src/rpc/index.ts',
    'web-worker': './src/web-worker/index.ts',
    'socket-io': './src/socket-io/index.ts',
  },
  stats: {
    colors: true,
    reasons: true,
  },
  module: {
    preLoaders: [
      { test: /\.js$/, loader: 'eslint-loader' },
    ],
    loaders: [ loaders.ts ],
  },
  output: {
    externals: {
      Rx: 'RxJs',
    },
    libraryTarget: 'umd',
    filename: path.normalize('/[name]/dist/[name].min.js'),
    path: path.join(__dirname, 'dist'),
  },
  plugins,
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
    loader: loader || 'awesome-typescript-loader',
    exclude: inTest ? /node_modules/ :
      /(node_modules\/|\.test\.ts$|tests\.\w+\.ts$)/,
  };
}
