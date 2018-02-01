<div align="center"><h1>Speed Measure Plugin</h1></div>
<br>

This plugin measures your webpack build speed, giving an output like this:

![Preview of Speed Measure Plugin's output](preview.png)

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
