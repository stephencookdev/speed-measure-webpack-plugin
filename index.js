const fs = require("fs");
const { WrappedPlugin } = require("./WrappedPlugin");
const { getModuleName, getLoaderNames } = require("./utils");
const {
  getHumanOutput,
  getMiscOutput,
  getPluginsOutput,
  getLoadersOutput,
} = require("./output");

module.exports = class SpeedMeasurePlugin {
  constructor(options) {
    this.options = options || {};

    this.timeEventData = {};

    this.getOutput = this.getOutput.bind(this);
    this.addTimeEvent = this.addTimeEvent.bind(this);
    this.apply = this.apply.bind(this);
  }

  static wrapPlugins(plugins, options) {
    if (options.disable) return Object.keys(plugins).map(k => plugins[k]);

    const smp = new SpeedMeasurePlugin(options);

    if (Array.isArray(plugins)) {
      let i = 1;
      plugins = plugins.reduce((acc, p) => {
        acc["plugin " + i++] = p;
        return acc;
      });
    }
    plugins = plugins || {};

    const wrappedPlugins = Object.keys(plugins).map(
      pluginName => new WrappedPlugin(plugins[pluginName], pluginName, smp)
    );

    return wrappedPlugins.concat(smp);
  }

  getOutput() {
    const outputObj = {};
    if (this.timeEventData.misc)
      outputObj.misc = getMiscOutput(this.timeEventData.misc);
    if (this.timeEventData.plugins)
      outputObj.plugins = getPluginsOutput(this.timeEventData.plugins);
    if (this.timeEventData.loaders)
      outputObj.loaders = getLoadersOutput(this.timeEventData.loaders);

    return this.options.outputFormat === "human"
      ? getHumanOutput(outputObj)
      : JSON.stringify(outputObj, null, 2);
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
      if (this.options.outputTarget) {
        const writeMethod = fs.existsSync(this.options.outputTarget)
          ? fs.appendFile
          : fs.writeFile;
        writeMethod(this.options.outputTarget, output + "\n", err => {
          if (err) throw err;
          console.log("Outputted timing info to " + this.options.outputTarget);
        });
      } else {
        console.log(output);
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
