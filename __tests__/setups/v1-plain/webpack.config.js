const webpack = require("webpack");

module.exports = {
  entry: {
    bundle: ["./app.js"],
  },
  output: {
    path: __dirname + "/dist"
  },
  plugins: [
    new webpack.DefinePlugin({ FOO: "'BAR'" })
  ],
  module: {
    loaders: [
      {
        test: /\.js?$/,
        loader: "babel-loader"
      },
      {
        test: /\.css$/,
        loaders: ["style-loader", "css-loader"]
      }
    ]
  }
};
