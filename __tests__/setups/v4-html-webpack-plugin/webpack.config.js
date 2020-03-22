const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

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
