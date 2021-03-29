const webpack = require("webpack");

let _compiler;
let _compilation;

class PluginOne {
  apply(compiler) {
    _compiler = compiler;

    compiler.hooks.emit.tapAsync("PluginOne", (compilation, callback) => {
      _compilation = compilation;
      callback();
    });
  }
}

class PluginVerify {
  apply(compiler) {
    if (_compiler !== compiler) {
      throw new Error("Compiler is different");
    }

    compiler.hooks.emit.tapAsync("PluginOne", (compilation, callback) => {
      if (_compilation !== compilation) {
        return callback(new Error("Compilation is different"));
      }
      callback();
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
    new PluginOne(),
    new PluginVerify(),
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
