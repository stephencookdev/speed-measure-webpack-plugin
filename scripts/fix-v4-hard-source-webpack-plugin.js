"use strict";

const fs = require("fs");
const path = require("path");

const target = path.join(
  process.cwd(),
  "node_modules",
  "hard-source-webpack-plugin",
  "lib",
  "hard-source-source-plugin.js"
);
const loggerTarget = path.join(
  process.cwd(),
  "node_modules",
  "hard-source-webpack-plugin",
  "lib",
  "logger-factory.js"
);

const before = `  console.log(source.constructor.name);
  console.log(source);
  process.exit()
`;

const after = `  if (source && source.constructor && source.constructor.name === 'OriginalSource') {
    return {
      type: 'OriginalSource',
      value: freezeArgument.value(null, source, extra, methods),
      name: freezeArgument.name(null, source, extra, methods),
    };
  }

  throw new Error('Unsupported source type: ' + source.constructor.name);
`;

if (!fs.existsSync(target)) {
  process.exit(0);
}

const source = fs.readFileSync(target, "utf8");

if (source.includes(before) && !source.includes(after)) {
  fs.writeFileSync(target, source.replace(before, after));
}

if (!fs.existsSync(loggerTarget)) {
  process.exit(0);
}

const loggerBefore = `  else {
    (console[value.level] || console.error).call(
      console,
      '[' + DEFAULT_LOGGER_PREFIX + LOGGER_SEPARATOR + value.from + ']',
      value.message
    );
  }
`;
const loggerAfter = `  else {
    return;
  }
`;
const loggerSource = fs.readFileSync(loggerTarget, "utf8");

if (
  loggerSource.includes(loggerBefore) &&
  !loggerSource.includes(loggerAfter)
) {
  fs.writeFileSync(
    loggerTarget,
    loggerSource.replace(loggerBefore, loggerAfter)
  );
}
