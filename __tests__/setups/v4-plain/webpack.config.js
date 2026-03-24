const webpack = require("webpack");

module.exports = {
  mode: "development",
  entry: {
    bundle: ["./app.js"],
  },
  output: {
    path: __dirname + "/dist",
    hashFunction: "sha256",
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
};
