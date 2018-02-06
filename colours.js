const greenFg = "\x1b[32m";
const yellowFg = "\x1b[33m";
const redFg = "\x1b[31m";
const blackBg = "\x1b[40m";
const bold = "\x1b[1m";
const end = "\x1b[0m";

module.exports.fg = (text, time) => {
  let colour;
  if (time >= 0) colour = greenFg;
  if (time > 2000) colour = yellowFg;
  if (time > 10000) colour = redFg;

  return (colour || "") + bold + text + end;
};

module.exports.bg = text => blackBg + greenFg + bold + text + end;

module.exports.stripColours = text => text.replace(/\x1b\[[0-9]+m/g, "");
