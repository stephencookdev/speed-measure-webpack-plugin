const SpeedMeasurePlugin = require("../../..");
const webpack = require("webpack");
const { readFileSync } = require("fs");
const webpackConfig = require("./webpack.config");

const getStandardConf = conf => {
  if (typeof conf === "function") conf = conf();
  const arr = Array.isArray(conf) ? conf : [conf];

  return arr.map(
    subConf => (typeof subConf === "function" ? subConf() : subConf)
  );
};

let i = 0;
const prepareSmpWebpackConfig = conf => {
  if (Array.isArray(conf)) return conf.map(prepareSmpWebpackConfig);
  if (typeof conf === "function")
    return (...args) => prepareSmpWebpackConfig(conf(...args));

  return Object.assign({}, conf, {
    output: {
      path: conf.output.path + "/_smp_" + i++ + "_" + new Date().getTime(),
    },
  });
};

const genSmpWebpackConfig = smp =>
  smp.wrap(prepareSmpWebpackConfig(webpackConfig));

const runWebpack = config =>
  new Promise((resolve, reject) => {
    const standardConf = getStandardConf(config);
    webpack(standardConf, (err, stats) => {
      if (err || stats.hasErrors()) return reject(err || stats);
      const fileContent = standardConf.map(conf =>
        readFileSync(conf.output.path + "/bundle.js").toString()
      );
      resolve(fileContent.join("\n///////// new file /////////\n"));
    });
  });

jest.setTimeout(20000);

const testRef = {};

describe("smp", () => {
  beforeAll(() =>
    runWebpack(webpackConfig).then(file => (testRef.distApp = file))
  );

  describe(__dirname.split("/").pop(), () => {
    const smp = new SpeedMeasurePlugin({
      outputTarget: output => (testRef.smpOutput = output),
    });
    const smpWebpackConfig = genSmpWebpackConfig(smp);

    beforeAll(() =>
      runWebpack(smpWebpackConfig).then(file => (testRef.smpDistApp = file))
    );

    it("should generate the same app.js content", () => {
      expect(testRef.smpDistApp).toEqual(testRef.distApp);
    });

    it("should generate the same app.js content after 2 runs", () => {
      const dupSmpWebpackConfig = genSmpWebpackConfig(smp);

      return runWebpack(dupSmpWebpackConfig).then(dupSmpDistApp => {
        expect(dupSmpDistApp).toEqual(testRef.smpDistApp);
        expect(dupSmpDistApp).toEqual(testRef.distApp);
      });
    });

    it("should state the time taken overall", () => {
      expect(testRef.smpOutput).toMatch(
        /General output time took .*([0-9]+ mins? )?[0-9]+(\.[0-9]+)? secs/
      );
    });

    it("should state the time taken by the plugins", () => {
      expect(testRef.smpOutput).toMatch(
        /DefinePlugin.* took .*([0-9]+ mins? )?[0-9]+(\.[0-9]+)? secs/
      );
    });

    it("should state the time taken by the loaders", () => {
      expect(testRef.smpOutput).toMatch(
        /babel-loader.* took .*([0-9]+ mins? )?[0-9]+(\.[0-9]+)? secs.*\n\s+module count\s+= [0-9]+/
      );
    });

    let customTests;
    try {
      customTests = require("./customTests");
    } catch (_) {
      // do nothing, we expect `require` to fail if no tests exist
    }
    if (customTests) {
      describe("custom tests", () => customTests(testRef));
    }
  });
});
