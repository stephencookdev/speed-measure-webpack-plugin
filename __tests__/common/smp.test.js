const SpeedMeasurePlugin = require("../../..");
const webpack = require("webpack");
const { readFileSync } = require("fs");
const webpackConfig = require("./webpack.config");

const genSmpWebpackConfig = smp =>
  smp.wrap(
    Object.assign({}, webpackConfig, {
      output: {
        path: webpackConfig.output.path + "/_smp_" + new Date().getTime(),
      },
    })
  );

const runWebpack = config =>
  new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err || stats.hasErrors()) return reject(err || stats);
      resolve(readFileSync(config.output.path + "/bundle.js").toString());
    });
  });

describe("smp - " + __dirname.split("/").pop(), () => {
  let distApp;
  beforeAll(() => runWebpack(webpackConfig).then(file => (distApp = file)));

  describe("vanilla config", () => {
    let smpOutput;
    let smpDistApp;
    const smp = new SpeedMeasurePlugin({
      outputTarget: output => (smpOutput = output),
    });
    const smpWebpackConfig = genSmpWebpackConfig(smp);

    beforeAll(() =>
      runWebpack(smpWebpackConfig).then(file => (smpDistApp = file))
    );

    it("should generate the same app.js content", () => {
      expect(smpDistApp).toEqual(distApp);
    });

    it("should generate the same app.js content after 2 runs", () => {
      const dupSmpWebpackConfig = genSmpWebpackConfig(smp);

      return runWebpack(dupSmpWebpackConfig).then(dupSmpDistApp => {
        expect(dupSmpDistApp).toEqual(smpDistApp);
        expect(dupSmpDistApp).toEqual(distApp);
      });
    });

    it("should state the time taken overall", () => {
      expect(smpOutput).toMatch(
        /General output time took .*([0-9]+ mins? )?[0-9]+(\.[0-9]+)? secs/
      );
    });

    it("should state the time taken by the plugins", () => {
      expect(smpOutput).toMatch(
        /DefinePlugin.* took .*([0-9]+ mins? )?[0-9]+(\.[0-9]+)? secs/
      );
    });

    it("should state the time taken by the loaders", () => {
      expect(smpOutput).toMatch(
        /babel-loader.* took .*([0-9]+ mins? )?[0-9]+(\.[0-9]+)? secs.*\n\s+module count\s+= [0-9]+/
      );
    });
  });
});
