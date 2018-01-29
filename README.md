# Speed Measure Webpack Plugin

**_(this plugin is not yet stable, and not safe for production)_**

**_(so far tested only with webpack@3.10.0, node@8.9.4)_**

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

`npm install --save-dev speed-measure-webpack-plugin`

Change your webpack config from

```
{
  entry: {...},
  output: {...},
  module: {...},
  plugins: [
    new MyPlugin(),
    new MyOtherPlugin()
  ]
}
```

to

```
{
  entry: {...},
  output: {...},
  module: {...},
  plugins: SpeedMeasurePlugin.wrapPlugins({
    MyPlugin: new MyPlugin(),
    MyOtherPlugin: new MyOtherPlugin()
  })
}
```

Or you can also specify config:

```
{
  entry: {...},
  output: {...},
  module: {...},
  plugins: SpeedMeasurePlugin.wrapPlugins({
    MyPlugin: new MyPlugin(),
    MyOtherPlugin: new MyOtherPlugin()
  }, {
    outputFormat: "human",
    outputTarget: "myFile.txt"
  })
}
```

## `outputFormat` ##

(default `"json"`)

 * `"json"` - produces a JSON blob
 * `"human"` - produces a human readable output

## `outputTarget` ##

(default `null`)

 * `null` - prints to `console.log`
 * `"foo"` - prints (and makes, if no file exists) to the file at location `"foo"`
