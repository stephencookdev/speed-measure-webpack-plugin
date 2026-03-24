const {
  beforeAll,
  describe,
  expect,
  it,
  setDefaultTimeout,
} = require("bun:test");
const SpeedMeasurePlugin = require("../../..");
const webpack = require("webpack");
const { readFileSync } = require("fs");
const webpackConfig = require("./webpack.config");

const getStandardConf = (conf) => {
  if (typeof conf === "function") conf = conf();
  const arr = Array.isArray(conf) ? conf : [conf];

  return arr.map((subConf) =>
    typeof subConf === "function" ? subConf() : subConf
  );
};

let i = 0;
const prepareSmpWebpackConfig = (conf) => {
  if (Array.isArray(conf)) return conf.map(prepareSmpWebpackConfig);
  if (typeof conf === "function")
    return (...args) => prepareSmpWebpackConfig(conf(...args));

  return Object.assign({}, conf, {
    output: {
      path: conf.output.path + "/_smp_" + i++ + "_" + new Date().getTime(),
    },
  });
};

const genSmpWebpackConfig = (smp) =>
  smp.wrap(prepareSmpWebpackConfig(webpackConfig));

const withCapturedOutput = (fn) => {
  const output = [];
  const writes = {
    stdout: process.stdout.write,
    stderr: process.stderr.write,
  };
  const emitWarning = process.emitWarning;
  const capture = (chunk, encoding, callback) => {
    output.push(Buffer.isBuffer(chunk) ? chunk.toString() : chunk);
    if (typeof encoding === "function") encoding();
    if (typeof callback === "function") callback();
    return true;
  };

  process.stdout.write = capture;
  process.stderr.write = capture;
  process.emitWarning = (...args) => {
    const [warning] = args;
    output.push(
      warning instanceof Error
        ? `${warning.name}: ${warning.message}\n`
        : `${warning}\n`
    );
  };

  const restore = () => {
    process.stdout.write = writes.stdout;
    process.stderr.write = writes.stderr;
    process.emitWarning = emitWarning;
  };
  const flush = () => {
    restore();
    const replay = output.join("");
    if (replay) {
      writes.stderr.call(process.stderr, replay);
    }
  };

  return fn({
    restore,
    flush,
  });
};

const runWebpack = (config) =>
  new Promise((resolve, reject) => {
    const standardConf = getStandardConf(config);
    withCapturedOutput(({ restore, flush }) => {
      webpack(standardConf, (err, stats) => {
        if (err || stats.hasErrors()) {
          flush();
          return reject(err || stats);
        }

        restore();
        const fileContent = standardConf.map((conf) =>
          readFileSync(conf.output.path + "/bundle.js").toString()
        );
        resolve(fileContent.join("\n///////// new file /////////\n"));
      });
    });
  });

setDefaultTimeout(20000);

const testRef = {};

describe("smp", () => {
  beforeAll(() =>
    runWebpack(webpackConfig).then((file) => (testRef.distApp = file))
  );

  describe(__dirname.split("/").pop(), () => {
    const smp = new SpeedMeasurePlugin({
      outputTarget: (output) => (testRef.smpOutput = output),
    });
    const smpWebpackConfig = genSmpWebpackConfig(smp);

    beforeAll(() =>
      runWebpack(smpWebpackConfig).then((file) => (testRef.smpDistApp = file))
    );

    it("should generate the same app.js content", () => {
      expect(testRef.smpDistApp).toEqual(testRef.distApp);
    });

    it("should generate the same app.js content after 2 runs", () => {
      const dupSmpWebpackConfig = genSmpWebpackConfig(smp);

      return runWebpack(dupSmpWebpackConfig).then((dupSmpDistApp) => {
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
