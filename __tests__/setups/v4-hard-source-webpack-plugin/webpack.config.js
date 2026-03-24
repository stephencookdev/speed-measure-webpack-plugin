const webpack = require("webpack");
const HardSourceWebpackPlugin = require("hard-source-webpack-plugin");

class SilenceHardSourceLogPlugin {
  apply(compiler) {
    if (compiler.hooks && compiler.hooks.hardSourceLog) {
      compiler.hooks.hardSourceLog.tap("SilenceHardSourceLogPlugin", () => {});
    }
  }
}

module.exports = {
  mode: "development",
  entry: {
    bundle: ["./app.js"],
  },
  output: {
    path: __dirname + "/dist",
    hashFunction: "sha256",
  },
  plugins: [
    new webpack.DefinePlugin({ FOO: "'BAR'" }),
    new HardSourceWebpackPlugin(),
    new SilenceHardSourceLogPlugin(),
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
