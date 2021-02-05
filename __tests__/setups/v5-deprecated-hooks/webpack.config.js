const webpack = require("webpack");

class Plugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap("Plugin", (compilation) => {
      // additionalAssets hook is deprecated
      // it will be frozen, and returnning a Proxied `tapAsync` will cause issue
      compilation.hooks.additionalAssets.tapAsync(
        "Plugin",
        async (callback) => {
          // do nothing
          callback();
        }
      );
    });
  }
}

module.exports = {
  entry: {
    bundle: ["./app.js"],
  },
  output: {
    path: __dirname + "/dist",
  },
  plugins: [
    new webpack.DefinePlugin({ FOO: "'BAR'" }),
    new Plugin(),
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
