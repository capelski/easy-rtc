const HtmlWebpackPlugin = require('html-webpack-plugin');
const { resolve } = require('path');

module.exports = {
  entry: './source/index.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          configFile: '../tsconfig.demo-core.json',
        },
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
          },
        ],
      },
    ],
  },
  output: {
    path: resolve(__dirname, '..', '..', '..', 'docs', 'core'),
    publicPath: '/easy-rtc/core',
  },
  plugins: [
    new HtmlWebpackPlugin({
      filename: './index.html',
      template: './source/index.html',
    }),
  ],
  resolve: {
    extensions: ['.js', '.ts'],
  },
};
