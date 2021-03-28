const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const { WrappedPlugin, clear } = require("./WrappedPlugin");
const {
  getModuleName,
  getLoaderNames,
  prependLoader,
  tap,
} = require("./utils");
const {
  getHumanOutput,
  getMiscOutput,
  getPluginsOutput,
  getLoadersOutput,
  smpTag,
} = require("./output");

const NS = path.dirname(fs.realpathSync(__filename));

module.exports = class SpeedMeasurePlugin {
  constructor(options) {
    this.options = options || {};

    this.timeEventData = {};
    this.smpPluginAdded = false;

    this.wrap = this.wrap.bind(this);
    this.getOutput = this.getOutput.bind(this);
    this.addTimeEvent = this.addTimeEvent.bind(this);
    this.apply = this.apply.bind(this);
    this.provideLoaderTiming = this.provideLoaderTiming.bind(this);
    this.generateLoadersBuildComparison = this.generateLoadersBuildComparison.bind(
      this
    );
  }

  wrap(config) {
    if (this.options.disable) return config;
    if (Array.isArray(config)) return config.map(this.wrap);
    if (typeof config === "function")
      return (...args) => this.wrap(config(...args));

    config.plugins = (config.plugins || []).map((plugin) => {
      const pluginName =
        Object.keys(this.options.pluginNames || {}).find(
          (pluginName) => plugin === this.options.pluginNames[pluginName]
        ) ||
        (plugin.constructor && plugin.constructor.name) ||
        "(unable to deduce plugin name)";
      return new WrappedPlugin(plugin, pluginName, this);
    });

    if (config.optimization && config.optimization.minimizer) {
      config.optimization.minimizer = config.optimization.minimizer.map(
        (plugin) => {
          return new WrappedPlugin(plugin, plugin.constructor.name, this);
        }
      );
    }

    if (config.module && this.options.granularLoaderData) {
      config.module = prependLoader(config.module);
    }

    if (!this.smpPluginAdded) {
      config.plugins = config.plugins.concat(this);
      this.smpPluginAdded = true;
    }

    return config;
  }

  generateLoadersBuildComparison() {
    const objBuildData = { loaderInfo: [] };
    const loaderFile = this.options.compareLoadersBuild.filePath;
    const outputObj = getLoadersOutput(this.timeEventData.loaders);

    if (!loaderFile) {
      throw new Error(
        "`options.compareLoadersBuild.filePath` is a required field"
      );
    }

    if (!outputObj) {
      throw new Error("No output found!");
    }

    const buildDetailsFile = fs.existsSync(loaderFile)
      ? fs.readFileSync(loaderFile)
      : "[]";
    const buildDetails = JSON.parse(buildDetailsFile.toString());
    const buildCount = buildDetails.length;
    const buildNo =
      buildCount > 0 ? buildDetails[buildCount - 1]["buildNo"] + 1 : 1;

    // create object format of current loader and write in the file
    outputObj.build.forEach((loaderObj) => {
      const loaderInfo = {};
      loaderInfo["Name"] = loaderObj.loaders.join(",") || "";
      loaderInfo["Time"] = loaderObj.activeTime || "";
      loaderInfo["Count"] =
        this.options.outputFormat === "humanVerbose"
          ? loaderObj.averages.dataPoints
          : "";
      loaderInfo[`Comparison`] = "";

      // Getting the comparison from the previous build by default only
      // in case if build data is more then one
      if (buildCount > 0) {
        const prevBuildIndex = buildCount - 1;
        for (
          var y = 0;
          y < buildDetails[prevBuildIndex]["loaderInfo"].length;
          y++
        ) {
          const prevloaderDetails =
            buildDetails[prevBuildIndex]["loaderInfo"][y];
          if (
            loaderInfo["Name"] == prevloaderDetails["Name"] &&
            prevloaderDetails["Time"]
          ) {
            const previousBuildTime =
              buildDetails[prevBuildIndex]["loaderInfo"][y]["Time"];
            const savedTime = previousBuildTime > loaderObj.activeTime;

            loaderInfo[`Comparison`] = `${savedTime ? "-" : "+"}${Math.abs(
              loaderObj.activeTime - previousBuildTime
            )}ms | ${savedTime ? "(slower)" : "(faster)"}`;
          }
        }
      }

      objBuildData["loaderInfo"].push(loaderInfo);
    });

    buildDetails.push({ buildNo, loaderInfo: objBuildData["loaderInfo"] });

    fs.writeFileSync(loaderFile, JSON.stringify(buildDetails));

    for (let i = 0; i < buildDetails.length; i++) {
      const outputTable = [];
      console.log("--------------------------------------------");
      console.log("Build No ", buildDetails[i]["buildNo"]);
      console.log("--------------------------------------------");

      if (buildDetails[i]["loaderInfo"]) {
        buildDetails[i]["loaderInfo"].forEach((buildInfo) => {
          const objCurrentBuild = {};
          objCurrentBuild["Name"] = buildInfo["Name"] || "";
          objCurrentBuild["Time (ms)"] = buildInfo["Time"] || "";
          if (this.options.outputFormat === "humanVerbose")
            objCurrentBuild["Count"] = buildInfo["Count"] || 0;
          objCurrentBuild["Comparison"] = buildInfo["Comparison"] || "";
          outputTable.push(objCurrentBuild);
        });
      }
      console.table(outputTable);
    }
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
    return getHumanOutput(
      outputObj,
      Object.assign(
        { verbose: this.options.outputFormat === "humanVerbose" },
        this.options
      )
    );
  }

  addTimeEvent(category, event, eventType, data = {}) {
    const allowFailure = data.allowFailure;
    delete data.allowFailure;

    const tED = this.timeEventData;
    if (!tED[category]) tED[category] = {};
    if (!tED[category][event]) tED[category][event] = [];
    const eventList = tED[category][event];
    const curTime = new Date().getTime();

    if (eventType === "start") {
      data.start = curTime;
      eventList.push(data);
    } else if (eventType === "end") {
      const matchingEvent = eventList.find((e) => {
        const allowOverwrite = !e.end || !data.fillLast;
        const idMatch = e.id !== undefined && e.id === data.id;
        const nameMatch =
          !data.id && e.name !== undefined && e.name === data.name;
        return allowOverwrite && (idMatch || nameMatch);
      });
      const eventToModify =
        matchingEvent || (data.fillLast && eventList.find((e) => !e.end));
      if (!eventToModify) {
        console.error(
          "Could not find a matching event to end",
          category,
          event,
          data
        );
        if (allowFailure) return;
        throw new Error("No matching event!");
      }

      eventToModify.end = curTime;
    }
  }

  apply(compiler) {
    if (this.options.disable) return;

    tap(compiler, "compile", () => {
      this.addTimeEvent("misc", "compile", "start", { watch: false });
    });
    tap(compiler, "done", () => {
      clear();
      this.addTimeEvent("misc", "compile", "end", { fillLast: true });

      const outputToFile = typeof this.options.outputTarget === "string";
      chalk.enabled = !outputToFile;
      const output = this.getOutput();
      chalk.enabled = true;
      if (outputToFile) {
        const writeMethod = fs.existsSync(this.options.outputTarget)
          ? fs.appendFileSync
          : fs.writeFileSync;
        writeMethod(this.options.outputTarget, output + "\n");
        console.log(
          smpTag() + "Outputted timing info to " + this.options.outputTarget
        );
      } else {
        const outputFunc = this.options.outputTarget || console.log;
        outputFunc(output);
      }

      if (this.options.compareLoadersBuild)
        this.generateLoadersBuildComparison();

      this.timeEventData = {};
    });

    tap(compiler, "compilation", (compilation) => {
      tap(compilation, "normal-module-loader", (loaderContext) => {
        loaderContext[NS] = this.provideLoaderTiming;
      });

      tap(compilation, "build-module", (module) => {
        const name = getModuleName(module);
        if (name) {
          this.addTimeEvent("loaders", "build", "start", {
            name,
            fillLast: true,
            loaders: getLoaderNames(module.loaders),
          });
        }
      });

      tap(compilation, "succeed-module", (module) => {
        const name = getModuleName(module);
        if (name) {
          this.addTimeEvent("loaders", "build", "end", {
            name,
            fillLast: true,
          });
        }
      });
    });
  }

  provideLoaderTiming(info) {
    const infoData = { id: info.id };
    if (info.type !== "end") {
      infoData.loader = info.loaderName;
      infoData.name = info.module;
    }

    this.addTimeEvent("loaders", "build-specific", info.type, infoData);
  }
};
