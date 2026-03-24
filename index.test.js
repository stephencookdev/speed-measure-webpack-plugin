const { describe, expect, it } = require("bun:test");
const SpeedMeasurePlugin = require("./index");

class IncludedPlugin {
  apply() {}
}

class ExcludedPlugin {
  apply() {}
}

class IncludedMinimizer {
  apply() {}
}

class ExcludedMinimizer {
  apply() {}
}

describe("wrap", () => {
  it("should exclude named plugins and minimizers from wrapping", () => {
    const includedPlugin = new IncludedPlugin();
    const excludedPlugin = new ExcludedPlugin();
    const includedMinimizer = new IncludedMinimizer();
    const excludedMinimizer = new ExcludedMinimizer();
    const smp = new SpeedMeasurePlugin({
      excludedPlugins: ["ExcludedPlugin", "ExcludedMinimizer"],
    });

    const wrappedConfig = smp.wrap({
      plugins: [includedPlugin, excludedPlugin],
      optimization: {
        minimizer: [includedMinimizer, excludedMinimizer],
      },
    });

    expect(wrappedConfig.plugins[0]).not.toBe(includedPlugin);
    expect(wrappedConfig.plugins[1]).toBe(excludedPlugin);
    expect(wrappedConfig.optimization.minimizer[0]).not.toBe(includedMinimizer);
    expect(wrappedConfig.optimization.minimizer[1]).toBe(excludedMinimizer);
  });

  it("should allow excluding plugins by constructor", () => {
    const includedPlugin = new IncludedPlugin();
    const excludedPlugin = new ExcludedPlugin();
    const smp = new SpeedMeasurePlugin({
      excludedPlugins: [ExcludedPlugin],
    });

    const wrappedConfig = smp.wrap({
      plugins: [includedPlugin, excludedPlugin],
    });

    expect(wrappedConfig.plugins[0]).not.toBe(includedPlugin);
    expect(wrappedConfig.plugins[1]).toBe(excludedPlugin);
  });

  it("should allow excluding plugins by regex", () => {
    const includedPlugin = new IncludedPlugin();
    const excludedPlugin = new ExcludedPlugin();
    const smp = new SpeedMeasurePlugin({
      excludedPlugins: [/Excluded/],
    });

    const wrappedConfig = smp.wrap({
      plugins: [includedPlugin, excludedPlugin],
    });

    expect(wrappedConfig.plugins[0]).not.toBe(includedPlugin);
    expect(wrappedConfig.plugins[1]).toBe(excludedPlugin);
  });

  it("should allow excluding plugins by custom pluginNames alias", () => {
    const aliasedPlugin = new ExcludedPlugin();
    const smp = new SpeedMeasurePlugin({
      pluginNames: {
        customPluginName: aliasedPlugin,
      },
      excludedPlugins: ["customPluginName"],
    });

    const wrappedConfig = smp.wrap({
      plugins: [aliasedPlugin],
    });

    expect(wrappedConfig.plugins[0]).toBe(aliasedPlugin);
  });

  it("should skip injecting granular timing for excluded loaders by name", () => {
    const smp = new SpeedMeasurePlugin({
      granularLoaderData: true,
      excludedLoaders: ["babel-loader"],
    });

    const wrappedConfig = smp.wrap({
      module: {
        rules: [{ use: ["babel-loader"] }, { use: ["file-loader"] }],
      },
    });

    expect(wrappedConfig.module.rules[0].use).toEqual(["babel-loader"]);
    expect(wrappedConfig.module.rules[1].use).toEqual([
      "speed-measure-webpack-plugin/loader",
      "file-loader",
    ]);
  });

  it("should skip injecting granular timing for excluded loaders by regex", () => {
    const smp = new SpeedMeasurePlugin({
      granularLoaderData: true,
      excludedLoaders: [/css-loader/],
    });

    const wrappedConfig = smp.wrap({
      module: {
        rules: [
          {
            use: ["style-loader", "/tmp/node_modules/css-loader/dist/cjs.js"],
          },
          { use: ["file-loader"] },
        ],
      },
    });

    expect(wrappedConfig.module.rules[1].use).toEqual([
      "speed-measure-webpack-plugin/loader",
      "file-loader",
    ]);
    expect(wrappedConfig.module.rules[0].use).toEqual([
      "style-loader",
      "/tmp/node_modules/css-loader/dist/cjs.js",
    ]);
  });

  it('should leave the webpack 5 "..." minimizer sentinel untouched', () => {
    const smp = new SpeedMeasurePlugin();

    const wrappedConfig = smp.wrap({
      optimization: {
        minimizer: ["..."],
      },
    });

    expect(wrappedConfig.optimization.minimizer).toEqual(["..."]);
  });
});
