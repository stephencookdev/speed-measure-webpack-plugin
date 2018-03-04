let idInc = 0;

const genPluginMethod = (orig, pluginName, smp, type) =>
  function(method, func) {
    const timeEventName = pluginName + "/" + type + "/" + method;
    const wrappedFunc = (...args) => {
      const id = idInc++;
      // we don't know if there's going to be a callback applied to a particular
      // call, so we just set it multiple times, letting each one override the last
      const addEndEvent = () =>
        smp.addTimeEvent("plugins", timeEventName, "end", {
          id,
          // we need to allow failure, since webpack can finish compilation and
          // cause our callbacks to fall on deaf ears
          allowFailure: true,
        });

      smp.addTimeEvent("plugins", timeEventName, "start", {
        id,
        name: pluginName,
      });
      // invoke an end event immediately in case the callback here causes webpack
      // to complete compilation. If this gets invoked and not the subsequent
      // call, then our data will be inaccurate, sadly
      addEndEvent();
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
  const shouldSoftWrap = Object.keys(orig)
    .map(k => orig[k])
    .some(getShouldWrap);

  if (!shouldWrap && !shouldSoftWrap) {
    const vanillaFunc = orig.name === "next";
    return vanillaFunc
      ? function() {
          // do this before calling the callback, since the callback can start
          // the next plugin step
          addEndEvent();

          return orig.apply(this, arguments);
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

    const wp = this;
    return new Proxy(plugin, {
      get(target, property) {
        if (property === "apply") {
          return wp.apply;
        }
        return target[property];
      },
      set: (target, property, value) => {
        return Reflect.set(target, property, value);
      },
      deleteProperty: (target, property) => {
        return Reflect.deleteProperty(target, property);
      },
    });
  }

  apply(compiler) {
    return this._smp_plugin.apply(
      wrap(compiler, this._smp_pluginName, this._smp)
    );
  }
};
