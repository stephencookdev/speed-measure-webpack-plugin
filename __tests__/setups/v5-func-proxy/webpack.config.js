const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: {
    bundle: ["./app.js"],
  },
  output: {
    path: __dirname + "/dist",
  },
  plugins: [new webpack.DefinePlugin({ FOO: "'BAR'" })],
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
  optimization: {
    minimizer: [
      // TerserPlugin need some properties of compiler.webpack function
      new TerserPlugin({ parallel: true }),
    ],
  },
};
