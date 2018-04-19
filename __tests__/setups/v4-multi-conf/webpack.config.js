const webpack = require("webpack");

const rules = [
  {
    test: /\.js?$/,
    use: "babel-loader"
  },
  {
    test: /\.css$/,
    use: ["style-loader", "css-loader"]
  }
];

const conf1 = {
  entry: {
    bundle: ["./app.js"],
  },
  plugins: [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  ],
  output: {
    path: __dirname + "/dist"
  },
  module: {},
};

const conf2 = JSON.parse(JSON.stringify(conf1));
conf2.plugins = [
  new webpack.DefinePlugin({ FOO: "'BAR'" })
];
conf2.output.path = __dirname + "/dist2";

conf1.module.rules = rules;
conf2.module.rules = rules;

module.exports = env => [conf1, conf2];
