const MS_IN_MINUTE = 60000;
const MS_IN_SECOND = 1000;

const { fg, bg } = require("./colours");
const { groupBy, getAverages, getTotalActiveTime } = require("./utils");

const humanTime = (ms, options = {}) => {
  if (options.verbose) {
    return ms.toLocaleString() + " ms";
  }

  const minutes = Math.floor(ms / MS_IN_MINUTE);
  const secondsRaw = (ms - minutes * MS_IN_MINUTE) / MS_IN_SECOND;
  const secondsWhole = Math.floor(secondsRaw);
  const remainderPrecision = secondsWhole > 0 ? 2 : 3;
  const secondsRemainder = Math.min(secondsRaw - secondsWhole, 0.99);
  const seconds =
    secondsWhole +
    secondsRemainder
      .toPrecision(remainderPrecision)
      .replace(/^0/, "")
      .replace(/0+$/, "")
      .replace(/^\.$/, "");

  let time = "";

  if (minutes > 0) time += minutes + " min" + (minutes > 1 ? "s" : "") + ", ";
  time += seconds + " secs";

  return time;
};

module.exports.getHumanOutput = (outputObj, options = {}) => {
  const hT = x => humanTime(x, options);
  const smpTag = bg(" SMP ") + " ⏱ ";
  let output = "\n\n" + smpTag + "\n";

  if (outputObj.misc) {
    output +=
      "General output time took " +
      fg(hT(outputObj.misc.compileTime, options), outputObj.misc.compileTime);
    output += "\n\n";
  }
  if (outputObj.plugins) {
    output += smpTag + " Plugins\n";
    Object.keys(outputObj.plugins)
      .sort(
        (name1, name2) => outputObj.plugins[name2] - outputObj.plugins[name1]
      )
      .forEach(pluginName => {
        output +=
          fg(pluginName) +
          " took " +
          fg(hT(outputObj.plugins[pluginName]), outputObj.plugins[pluginName]);
        output += "\n";
      });
    output += "\n";
  }
  if (outputObj.loaders) {
    output += smpTag + " Loaders\n";
    outputObj.loaders.build
      .sort((obj1, obj2) => obj2.activeTime - obj1.activeTime)
      .forEach(loaderObj => {
        output +=
          loaderObj.loaders.map(fg).join(", and \n") +
          " took " +
          fg(hT(loaderObj.activeTime), loaderObj.activeTime) +
          "\n";

        if (options.verbose) {
          output +=
            "    median       = " + hT(loaderObj.averages.median) + ",\n";
          output += "    mean         = " + hT(loaderObj.averages.mean) + ",\n";
          if (typeof loaderObj.averages.variance === "number")
            output +=
              "    s.d          = " +
              hT(Math.sqrt(loaderObj.averages.variance)) +
              ", \n";
          output +=
            "    range        = (" +
            hT(loaderObj.averages.range.start) +
            " --> " +
            hT(loaderObj.averages.range.end) +
            "), \n";
        }

        output += "    module count = " + loaderObj.averages.dataPoints + "\n";
        output +=
          "    sub loaders  = " +
          JSON.stringify(loaderObj.subLoadersTime) +
          "\n";
      });
  }

  output += "\n\n";

  return output;
};

module.exports.getMiscOutput = data => ({
  compileTime: data.compile[0].end - data.compile[0].start,
});

module.exports.getPluginsOutput = data =>
  Object.keys(data).reduce((acc, key) => {
    const inData = data[key];

    const startEndsByName = groupBy("name", inData);

    return startEndsByName.reduce((innerAcc, startEnds) => {
      innerAcc[startEnds[0].name] =
        (innerAcc[startEnds[0].name] || 0) + getTotalActiveTime(startEnds);
      return innerAcc;
    }, acc);
  }, {});

module.exports.getLoadersOutput = data => {
  const startEndsByLoader = groupBy("loaders", data.build);
  const allSubLoaders = data["build-specific"];

  const buildData = startEndsByLoader.map(startEnds => {
    const averages = getAverages(startEnds);
    const activeTime = getTotalActiveTime(startEnds);
    const subLoaders = groupBy(
      "loader",
      allSubLoaders.filter(l => startEnds.find(x => x.name === l.name))
    );
    console.log(JSON.stringify(subLoaders));
    const subLoadersActiveTime = subLoaders.reduce((acc, loaders) => {
      acc[loaders[0].loader] = getTotalActiveTime(loaders);
      return acc;
    }, {});

    return {
      averages,
      activeTime,
      loaders: startEnds[0].loaders,
      subLoadersTime: subLoadersActiveTime,
    };
  });

  return { build: buildData };
};
