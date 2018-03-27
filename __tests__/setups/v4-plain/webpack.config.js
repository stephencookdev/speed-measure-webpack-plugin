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
    rules: [
      {
        test: /\.js?$/,
        use: "babel-loader"
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      }
    ]
  }
};
