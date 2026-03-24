"use strict";

const fs = require("fs");
const path = require("path");

const target = path.join(
  process.cwd(),
  "node_modules",
  "node-libs-browser",
  "index.js"
);
const before = "require.resolve('browserify-zlib')";
const after = "require.resolve('browserify-zlib/src/index.js')";

if (!fs.existsSync(target)) {
  process.exit(0);
}

const source = fs.readFileSync(target, "utf8");

if (!source.includes(before) || source.includes(after)) {
  process.exit(0);
}

fs.writeFileSync(target, source.replace(before, after));
