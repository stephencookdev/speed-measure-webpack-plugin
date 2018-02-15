const path = require("path");
const fs = require("fs");

let id = 0;

const NS = path.dirname(fs.realpathSync(__filename));

const getLoaderName = path => {
  const nodeModuleName = /\/node_modules\/([^\/]+)/.exec(path);
  return (nodeModuleName && nodeModuleName[1]) || "";
};

module.exports.pitch = function() {
  const callback = this[NS];
  const module = this.resourcePath;

  // we can not have a NS attached to `this` if the loader is being called in
  // a weird wrapped environment (such as how thread-loader runs)
  if (!callback) return;

  this.loaders.forEach(l => {
    if (!l.normal) return;

    const loaderId = id++ + l.path;
    const origNormalFunc = l.normal;
    const loaderName = getLoaderName(l.path);
    l.normal = function() {
      const almostThis = Object.assign({}, this, {
        async: function() {
          const asyncCallback = this.async.apply(this, arguments);

          return function() {
            callback({
              module,
              loaderName,
              id: loaderId,
              type: "end",
            });
            asyncCallback.apply(this, arguments);
          };
        }.bind(this),
      });

      callback({
        module,
        loaderName,
        id: loaderId,
        type: "start",
      });

      const ret = origNormalFunc.apply(almostThis, arguments);

      callback({
        module,
        loaderName,
        id: loaderId,
        type: "end",
      });

      return ret;
    };
  });
};
