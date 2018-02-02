const { b } = require("./colours");
const { groupBy, getAverages, getTotalActiveTime } = require("./utils");

const humanTime = ms => {
  const hours = ms / 3600000;
  const minutes = ms / 60000;
  const seconds = ms / 1000;

  if (hours > 0.5) return hours.toFixed(2) + " hours";
  if (minutes > 0.5) return minutes.toFixed(2) + " minutes";
  if (seconds > 0.5) return seconds.toFixed(2) + " seconds";
  return ms.toFixed(0) + " milliseconds";
};

module.exports.getHumanOutput = outputObj => {
  const delim = "----------------------------";
  let output = delim + "\n";

  if (outputObj.misc) {
    output +=
      "General output time took " +
      b(humanTime(outputObj.misc.compileTime), outputObj.misc.compileTime);
    output += "\n\n";
  }
  if (outputObj.plugins) {
    Object.keys(outputObj.plugins).forEach(pluginName => {
      output +=
        b(pluginName) +
        " took " +
        b(
          humanTime(outputObj.plugins[pluginName]),
          outputObj.plugins[pluginName]
        );
      output += "\n";
    });
    output += "\n";
  }
  if (outputObj.loaders) {
    outputObj.loaders.build.forEach(loaderObj => {
      output +=
        loaderObj.loaders.map(b).join(", and \n") +
        " took " +
        b(humanTime(loaderObj.activeTime), loaderObj.activeTime);
      output += "\n";
      output +=
        "    median       = " + humanTime(loaderObj.averages.median) + ",\n";
      output +=
        "    mean         = " + humanTime(loaderObj.averages.mean) + ",\n";
      if (typeof loaderObj.averages.variance === "number")
        output +=
          "    s.d          = " +
          humanTime(Math.sqrt(loaderObj.averages.variance)) +
          ", \n";
      output +=
        "    range        = (" +
        humanTime(loaderObj.averages.range.start) +
        ", " +
        humanTime(loaderObj.averages.range.end) +
        "), \n";
      output += "    module count = " + loaderObj.averages.dataPoints + "\n";
    });
  }

  output += delim + "\n";

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

module.exports.getLoadersOutput = data =>
  Object.keys(data).reduce((acc, key) => {
    const startEndsByLoader = groupBy("loaders", data[key]);

    acc[key] = startEndsByLoader.map(startEnds => {
      const averages = getAverages(startEnds);
      const activeTime = getTotalActiveTime(startEnds);

      return {
        averages,
        activeTime,
        loaders: startEnds[0].loaders,
      };
    });

    return acc;
  }, {});
