# Speed Measure Plugin

This plugin measures your webpack build speed, giving an output like this:

```
----------------------------
General output time took 1.01 minutes

IgnorePlugin took 0.62 seconds
ForceCaseSensitivityPlugin took 20.27 seconds
SpriteLoaderPlugin took 30 milliseconds
ExtractTextPlugin took 9.44 seconds
DefinePlugin took 1 milliseconds

thread-loader, and
babel-loader took 0.56 minutes
    Med   = 401 milliseconds,
    x̄     = 1.08 seconds,
    σ     = 0.57 seconds,
    range = (268 milliseconds, 2.49 seconds),
    n     = 247
file-loader took 7.11 seconds
    Med   = 1.41 seconds,
    x̄     = 1.26 seconds,
    σ     = 436 milliseconds,
    range = (340 milliseconds, 2.02 seconds),
    n     = 29
----------------------------
```

# Getting Started

`npm install --save speed-measure-webpack-plugin`

Change your webpack config from

```javascript
{
  entry: {/*...*/},
  output: {/*...*/},
  module: {/*...*/},
  plugins: [
    new MyPlugin(),
    new MyOtherPlugin()
  ]
}
```

to

```javascript
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");

{
  entry: {/*...*/},
  output: {/*...*/},
  module: {/*...*/},
  plugins: SpeedMeasurePlugin.wrapPlugins({
    MyPlugin: new MyPlugin(),
    MyOtherPlugin: new MyOtherPlugin()
  })
}
```

Or you can also specify config:

```javascript
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");

{
  entry: {/*...*/},
  output: {/*...*/},
  module: {/*...*/},
  plugins: SpeedMeasurePlugin.wrapPlugins({
    MyPlugin: new MyPlugin(),
    MyOtherPlugin: new MyOtherPlugin()
  }, {
    outputFormat: "human",
    outputTarget: "myFile.txt"
  })
}
```

If you're using `webpack-merge`, then you can do:

```javascript
// base config file
const smp = new SpeedMeasurePlugin({
  outputFormat: "human"
});

const finalConfig = webpackMerge(
  [baseConfig, envSpecificConfig].map(configGenerator =>
    configGenerator({
      smp,
      // other options
    })
  )
);

// baseConfig
export const baseConfig = ({ smp }) => ({
  plugins: smp.wrapPlugins({
    MyPlugin: new MyPlugin()
  }).concat(smp)
})

// envSpecificConfig
export const envSpecificConfig = ({ smp }) => ({
  plugins: smp.wrapPlugins({
    MyOtherPlugin: new MyOtherPlugin()
  })
})
```

## `outputFormat` ##

(default `"json"`)

 * `"json"` - produces a JSON blob
 * `"human"` - produces a human readable output

## `outputTarget` ##

(default `null`)

 * `null` - prints to `console.log`
 * `"foo"` - prints (and makes, if no file exists) to the file at location `"foo"`

## `disable` ##

(default `null`)

If truthy, this plugin does nothing at all (recommended by default)
