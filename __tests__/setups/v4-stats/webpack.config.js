const webpack = require("webpack");
class StatsPlugin {
  constructor(output) {
    this.output = output;
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync("StatsPlugin", (compilation, callback) => {
      let result;

      compilation.assets[this.output] = {
        size() {
          return result ? result.length : 0;
        },
        source() {
          result = JSON.stringify(compilation.getStats().toJson());
          return result;
        },
      };

      callback();
    });
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
    new StatsPlugin("stats.json"),
    // StatsPlugin needs to be placed _before_ DefinePlugin to repro the issue
    new webpack.DefinePlugin({ FOO: "'BAR'" }),
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
