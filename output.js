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

const b = text => "\x1b[1m" + text + "\x1b[0m";
const bb = text => "\x1b[1m\x1b[32m" + text + "\x1b[0m";

module.exports.getHumanOutput = outputObj => {
  const delim = "----------------------------";
  let output = delim + "\n";

  if (outputObj.misc) {
    output +=
      "General output time took " + bb(humanTime(outputObj.misc.compileTime));
    output += "\n\n";
  }
  if (outputObj.plugins) {
    Object.keys(outputObj.plugins).forEach(pluginName => {
      output +=
        b(pluginName) + " took " + bb(humanTime(outputObj.plugins[pluginName]));
      output += "\n";
    });
    output += "\n";
  }
  if (outputObj.loaders) {
    outputObj.loaders.build.forEach(loaderObj => {
      output +=
        loaderObj.loaders.map(b).join(", and \n") +
        " took " +
        bb(humanTime(loaderObj.activeTime));
      output += "\n";
      output += "    Med   = " + humanTime(loaderObj.averages.median) + ",\n";
      output += "    x̄     = " + humanTime(loaderObj.averages.mean) + ",\n";
      if (typeof loaderObj.averages.variance === "number")
        output +=
          "    σ     = " +
          humanTime(Math.sqrt(loaderObj.averages.variance)) +
          ", \n";
      output +=
        "    range = (" +
        humanTime(loaderObj.averages.range.start) +
        ", " +
        humanTime(loaderObj.averages.range.end) +
        "), \n";
      output += "    n     = " + loaderObj.averages.dataPoints + "\n";
    });
  }

  output += delim + "\n";

  return output;
};

module.exports.getMiscOutput = data => ({
  compileTime: data.compile[0].end - data.compile[0].start,
});

module.exports.getPluginsOutput = data =>
  Object.values(data).reduce((acc, inData) => {
    const startEndsByName = groupBy("name", inData);

    return startEndsByName.reduce(
      (innerAcc, startEnds) => ({
        ...innerAcc,
        [startEnds[0].name]:
          (innerAcc[startEnds[0].name] || 0) + getTotalActiveTime(startEnds),
      }),
      acc
    );
  }, {});

module.exports.getLoadersOutput = data =>
  Object.keys(data).reduce((acc, key) => {
    const startEndsByLoader = groupBy("loaders", data[key]);

    return {
      ...acc,
      [key]: startEndsByLoader.map(startEnds => {
        const averages = getAverages(startEnds);
        const activeTime = getTotalActiveTime(startEnds);

        return {
          averages,
          activeTime,
          loaders: startEnds[0].loaders,
        };
      }),
    };
  }, {});
