const webpack = require("webpack");
const StatsPlugin = require("stats-webpack-plugin");

module.exports = {
  entry: {
    bundle: ["./app.js"],
  },
  output: {
    path: __dirname + "/dist"
  },
  plugins: [
    new StatsPlugin("stats.json"),
    // StatsPlugin needs to be placed _before_ DefinePlugin to repro the issue
    new webpack.DefinePlugin({ FOO: "'BAR'" }),
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
