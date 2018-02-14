let idInc = 0;

const genPluginMethod = (orig, pluginName, smp, type) =>
  function(method, func) {
    const id = idInc++;
    const timeEventName = type + "/" + method;

    const wrappedFunc = (...args) => {
      smp.addTimeEvent("plugins", timeEventName, "start", {
        id,
        name: pluginName,
      });
      const ret = func.apply(this, args.map(a => wrap(a, pluginName, smp)));
      smp.addTimeEvent("plugins", timeEventName, "end", { id });
      return ret;
    };

    return orig.plugin(method, wrappedFunc);
  };

const construcNamesToWrap = [
  "Compiler",
  "Compilation",
  "MainTemplate",
  "Parser",
  "NormalModuleFactory",
  "ContextModuleFactory",
];

const wrap = (orig, pluginName, smp) => {
  const origConstrucName = orig && orig.constructor && orig.constructor.name;
  const shouldWrap = construcNamesToWrap.includes(origConstrucName);
  if (!shouldWrap) return orig;

  const proxy = new Proxy(orig, {
    get: (target, property) => {
      if (property === "plugin")
        return genPluginMethod(orig, pluginName, smp, origConstrucName).bind(
          proxy
        );

      if (typeof orig[property] === "function")
        return orig[property].bind(proxy);
      return wrap(orig[property], pluginName, smp);
    },
    set: (target, property, value) => {
      return Reflect.set(target, property, value);
    },
    deleteProperty: (target, property) => {
      delete target[property];
    },
  });

  return proxy;
};

module.exports.WrappedPlugin = class WrappedPlugin {
  constructor(plugin, pluginName, smp) {
    this._smp_plugin = plugin;
    this._smp_pluginName = pluginName;
    this._smp = smp;

    this.apply = this.apply.bind(this);
  }

  apply(compiler) {
    return this._smp_plugin.apply(
      wrap(compiler, this._smp_pluginName, this._smp)
    );
  }
};
