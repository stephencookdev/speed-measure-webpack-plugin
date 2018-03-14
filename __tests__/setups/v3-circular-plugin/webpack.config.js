const webpack = require("webpack");

class CircularPlugin {
  constructor() {
    this.apply = this.apply.bind(this);
  }

  apply(compiler) {
    compiler.compilation = new (function Compilation(){})();
    compiler.parser = new (function Parser(){})();
    compiler.compilation.parser = compiler.parser;
    compiler.parser.compilation = compiler.compilation;

    compiler.plugin("compile", () => {
      // do some random calc with the looped compilation object, to force its
      // evaluation
      if(compiler.compilation.parser.compilation === false) {
        console.log("foo");
      }
    });
  }
}

module.exports = {
  entry: {
    bundle: ["./app.js"],
  },
  output: {
    path: __dirname + "/dist"
  },
  plugins: [
    new webpack.DefinePlugin({ FOO: "'BAR'" }),
    new CircularPlugin(),
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
