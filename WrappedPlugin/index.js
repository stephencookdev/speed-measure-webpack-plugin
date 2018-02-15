let idInc = 0;

const genPluginMethod = (orig, pluginName, smp, type) =>
  function(method, func) {
    const wrappedFunc = (...args) => {
      const id = idInc++;
      const timeEventName = pluginName + "/" + type + "/" + method;
      // we don't know if there's going to be a callback applied to a particular
      // call, so we just set it multiple times, letting each one override the last
      const addEndEvent = () =>
        smp.addTimeEvent("plugins", timeEventName, "end", { id });

      smp.addTimeEvent("plugins", timeEventName, "start", {
        id,
        name: pluginName,
      });
      const ret = func.apply(
        this,
        args.map(a => wrap(a, pluginName, smp, addEndEvent))
      );
      addEndEvent();

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

const wrap = (orig, pluginName, smp, addEndEvent) => {
  if (!orig) return orig;

  const getOrigConstrucName = target =>
    target && target.constructor && target.constructor.name;
  const getShouldWrap = target => {
    const origConstrucName = getOrigConstrucName(target);
    return construcNamesToWrap.includes(origConstrucName);
  };
  const shouldWrap = getShouldWrap(orig);
  const shouldSoftWrap = Object.values(orig).some(getShouldWrap);

  if (!shouldWrap && !shouldSoftWrap) {
    const vanillaFunc =
      typeof orig === "function" &&
      orig &&
      orig.prototype &&
      orig.prototype.constructor !== orig;
    return vanillaFunc
      ? function() {
          const ret = orig();
          addEndEvent();
          return ret;
        }
      : orig;
  }

  const proxy = new Proxy(orig, {
    get: (target, property) => {
      if (shouldWrap && property === "plugin")
        return genPluginMethod(
          orig,
          pluginName,
          smp,
          getOrigConstrucName(target)
        ).bind(proxy);

      if (typeof orig[property] === "function")
        return orig[property].bind(proxy);
      return wrap(orig[property], pluginName, smp);
    },
    set: (target, property, value) => {
      return Reflect.set(target, property, value);
    },
    deleteProperty: (target, property) => {
      return Reflect.deleteProperty(target, property);
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
