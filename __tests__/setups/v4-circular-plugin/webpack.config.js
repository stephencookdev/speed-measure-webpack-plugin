const webpack = require("webpack");

class CircularPlugin {
  apply(compiler) {
    compiler.compilation = new (function Compilation() {})();
    compiler.parser = new (function Parser() {})();
    compiler.compilation.parser = compiler.parser;
    compiler.parser.compilation = compiler.compilation;

    compiler.hooks.compile.tap("CircularPlugin", () => {
      // do some random calc with the looped compilation object, to force its
      // evaluation
      if (compiler.compilation.parser.compilation === false) {
        console.log("foo");
      }
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
  plugins: [new webpack.DefinePlugin({ FOO: "'BAR'" }), new CircularPlugin()],
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
