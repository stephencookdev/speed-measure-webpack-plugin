const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const SpeedMeasurePlugin = require("../../..");
const smp = new SpeedMeasurePlugin();

class Plugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap("Plugin", (compilation) => {
      // Test plugin execution time
      const now = Date.now();
      while (Date.now() - now < 2000) {
        continue;
      }
    });

    compiler.hooks.emit.tapAsync(
      "HelloAsyncPlugin",
      (compilation, callback) => {
        setTimeout(function () {
          callback();
        }, 1000);
      }
    );
  }
}

const options = {
  entry: {
    bundle: ["./app.js"],
  },
  output: {
    path: __dirname + "/dist",
  },
  plugins: [
    new webpack.DefinePlugin({ FOO: "'BAR'" }),
    new Plugin(),
    new MiniCssExtractPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.js?$/,
        use: ["babel-loader"],
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
};

module.exports = options;
