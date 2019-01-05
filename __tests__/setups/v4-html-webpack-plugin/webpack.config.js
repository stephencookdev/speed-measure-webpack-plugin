const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CustomPlugin = require('./customPlugin')

module.exports = {
  entry: {
    bundle: ["./app.js"],
  },
  output: {
    path: __dirname + "/dist",
  },
  plugins: [
    new webpack.DefinePlugin({ FOO: "'BAR'" }),
    new HtmlWebpackPlugin(),
    new CustomPlugin()
  ],
  module: {
    rules: [
      {
        test: /\.js?$/,
        use: "babel-loader",
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
};
