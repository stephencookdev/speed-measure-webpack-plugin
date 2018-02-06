const fs = require("fs");
const { WrappedPlugin } = require("./WrappedPlugin");
const { getModuleName, getLoaderNames } = require("./utils");
const {
  getHumanOutput,
  getMiscOutput,
  getPluginsOutput,
  getLoadersOutput,
} = require("./output");
const { stripColours } = require("./colours");

module.exports = class SpeedMeasurePlugin {
  constructor(options) {
    this.options = options || {};

    this.timeEventData = {};

    this.wrapPlugins = this.wrapPlugins.bind(this);
    this.getOutput = this.getOutput.bind(this);
    this.addTimeEvent = this.addTimeEvent.bind(this);
    this.apply = this.apply.bind(this);
  }

  static wrapPlugins(plugins, options) {
    if (options.disable) return Object.keys(plugins).map(k => plugins[k]);

    const smp = new SpeedMeasurePlugin(options);

    const wrappedPlugins = smp.wrapPlugins(plugins);

    return wrappedPlugins.concat(smp);
  }

  wrapPlugins(plugins) {
    if (Array.isArray(plugins)) {
      let i = 1;
      plugins = plugins.reduce((acc, p) => {
        acc["plugin " + i++] = p;
        return acc;
      });
    }
    plugins = plugins || {};

    return Object.keys(plugins).map(
      pluginName => new WrappedPlugin(plugins[pluginName], pluginName, this)
    );
  }

  getOutput() {
    const outputObj = {};
    if (this.timeEventData.misc)
      outputObj.misc = getMiscOutput(this.timeEventData.misc);
    if (this.timeEventData.plugins)
      outputObj.plugins = getPluginsOutput(this.timeEventData.plugins);
    if (this.timeEventData.loaders)
      outputObj.loaders = getLoadersOutput(this.timeEventData.loaders);

    if (this.options.outputFormat === "json")
      return JSON.stringify(outputObj, null, 2);
    if (typeof this.options.outputFormat === "function")
      return this.options.outputFormat(outputObj);
    return getHumanOutput(outputObj, {
      verbose: this.options.outputFormat === "humanVerbose",
    });
  }

  addTimeEvent(category, event, eventType, data = {}) {
    const tED = this.timeEventData;
    if (!tED[category]) tED[category] = {};
    if (!tED[category][event]) tED[category][event] = [];
    const eventList = tED[category][event];
    const curTime = new Date().getTime();

    if (eventType === "start") {
      data.start = curTime;
      eventList.push(data);
    } else if (eventType === "end") {
      const matchingEvent = eventList.find(
        e => !e.end && (e.id === data.id || e.name === data.name)
      );
      const eventToModify = matchingEvent || eventList.find(e => !e.end);
      if (!eventToModify) {
        console.log(
          "Could not find a matching event to end",
          category,
          event,
          data
        );
        throw new Error("No matching event!");
      }

      eventToModify.end = curTime;
    }
  }

  apply(compiler) {
    if (this.options.disable) return;

    compiler.plugin("compile", () => {
      this.addTimeEvent("misc", "compile", "start", { watch: false });
    });
    compiler.plugin("done", () => {
      this.addTimeEvent("misc", "compile", "end");

      const output = this.getOutput();
      if (typeof this.options.outputTarget === "string") {
        const strippedOutput = stripColours(output);
        const writeMethod = fs.existsSync(this.options.outputTarget)
          ? fs.appendFile
          : fs.writeFile;
        writeMethod(this.options.outputTarget, strippedOutput + "\n", err => {
          if (err) throw err;
          console.log("Outputted timing info to " + this.options.outputTarget);
        });
      } else {
        const outputFunc = this.options.outputTarget || console.log;
        outputFunc(output);
      }

      this.timeEventData = {};
    });

    compiler.plugin("compilation", compilation => {
      compilation.plugin("build-module", module => {
        const name = getModuleName(module);
        if (name) {
          this.addTimeEvent("loaders", "build", "start", {
            name,
            loaders: getLoaderNames(module.loaders),
          });
        }
      });

      compilation.plugin("succeed-module", module => {
        const name = getModuleName(module);
        if (name) {
          this.addTimeEvent("loaders", "build", "end", { name });
        }
      });
    });
  }
};
