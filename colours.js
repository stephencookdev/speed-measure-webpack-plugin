const green = "\x1b[32m";
const yellow = "\x1b[33m";
const red = "\x1b[31m";
const bold = "\x1b[1m";
const end = "\x1b[0m";

module.exports.b = (text, time) => {
  let colour;
  if (time >= 0) colour = green;
  if (time > 2000) colour = yellow;
  if (time > 10000) colour = red;

  return (colour || "") + bold + text + end;
};

module.exports.stripColours = text => text.replace(/\x1b\[[0-9]+m/g, "");
