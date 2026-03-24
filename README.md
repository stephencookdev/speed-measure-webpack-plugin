<div align="center">
  <img width="120" height="120" src="https://raw.githubusercontent.com/stephencookdev/speed-measure-webpack-plugin/refs/heads/master/logo.svg" />
  <h1>
    Speed Measure Plugin
    <div><sup><em>(for webpack)</em></sup></div>
  </h1>
  <p>
    <a href="https://18ways.com">Proudly maintained and developed by the team at <strong>18ways</strong></a>.<br />
    <sub>AI-powered runtime localisation and i18n infrastructure.</sub>
  </p>

<a href="https://18ways.com"><img alt="18ways Logo" src="https://img.shields.io/badge/MADE%20BY%2018ways-119955.svg?style=for-the-badge&logo=18ways&labelColor=119955"></a>
<a href="https://npmjs.com/package/speed-measure-webpack-plugin"><img src="https://img.shields.io/npm/dw/speed-measure-webpack-plugin.svg?style=for-the-badge" /></a> <a href="https://npmjs.com/package/speed-measure-webpack-plugin"><img src="https://img.shields.io/node/v/speed-measure-webpack-plugin.svg?style=for-the-badge" /></a>

</div>
<br>

The first step to optimising your webpack build speed, is to know where to focus your attention.

This plugin measures your webpack build speed, giving an output like this:

![Preview of Speed Measure Plugin's output](preview.png)

## Install

```bash
npm install --save-dev speed-measure-webpack-plugin
```

or

```bash
yarn add -D speed-measure-webpack-plugin
```

## Requirements

SMP requires at least **Node v6**. But otherwise, accepts **all webpack** versions (1, 2, 3, 4, and 5).

To work on the repository itself and run the test suite, use **Node v18+**.

## Usage

Change your webpack config from

```javascript
const webpackConfig = {
  plugins: [new MyPlugin(), new MyOtherPlugin()],
};
```

to

```javascript
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");

const smp = new SpeedMeasurePlugin();

const webpackConfig = smp.wrap({
  plugins: [new MyPlugin(), new MyOtherPlugin()],
});
```

and you're done! SMP will now be printing timing output to the console by default.

Check out the [examples folder](/examples) for some more examples.

## Options

Pass these into the constructor, as an object:

```javascript
const smp = new SpeedMeasurePlugin(options);
```

### `options.disable`

Type: `Boolean`<br>
Default: `false`

If truthy, this plugin does nothing at all.

`{ disable: !process.env.MEASURE }` allows opt-in measurements with `MEASURE=true npm run build`.

### `options.outputFormat`

Type: `String|Function`<br>
Default: `"human"`

Determines in what format this plugin prints its measurements

- `"json"` - produces a JSON blob
- `"human"` - produces a human readable output
- `"humanVerbose"` - produces a more verbose version of the human readable output
- If a function, it will call the function with the JSON blob, and output the response

### `options.outputTarget`

Type: `String|Function`<br>
Default: `console.log`

- If a string, it specifies the path to a file to output to.
- If a function, it will call the function with the output as the first parameter

### `options.pluginNames`

Type: `Object`<br>
Default: `{}`

By default, SMP derives plugin names through `plugin.constructor.name`. For some
plugins this doesn't work (or you may want to override this default). This option
takes an object of `pluginName: PluginConstructor`, e.g.

```javascript
const uglify = new UglifyJSPlugin();
const smp = new SpeedMeasurePlugin({
  pluginNames: {
    customUglifyName: uglify,
  },
});

const webpackConfig = smp.wrap({
  plugins: [uglify],
});
```

### `options.excludedPlugins`

Type: `Array<String|Function|RegExp>`<br>
Default: `[]`

Excludes plugins from SMP's proxy wrapping. Entries can be:

- a plugin name
- a plugin constructor
- a regular expression matched against plugin names

Name matching checks both `options.pluginNames` aliases and constructor names. E.g.

```javascript
const smp = new SpeedMeasurePlugin({
  pluginNames: {
    customReactRefresh: reactRefreshPlugin,
  },
  excludedPlugins: [
    "customReactRefresh",
    MiniCssExtractPlugin,
    /SomeLegacyPlugin$/,
  ],
});
```

### `options.loaderTopFiles`

Type: `Number`<br>
Default: `0`

You can configure SMP to include the files that take the most time per loader, when using `outputFormat: 'humanVerbose'`. E.g., to show the top 10 files per loader:

```javascript
const smp = new SpeedMeasurePlugin({
  outputFormat: "humanVerbose",
  loaderTopFiles: 10,
});
```

### `options.compareLoadersBuild`

Type: `Object`<br>
Default: `{}`

This option gives you a comparison over time of the module count and time spent, per loader. This option provides more data when `outputFormat: "humanVerbose"`.

Given a required `filePath` to store the build information, this option allows you to compare differences to your codebase over time. E.g.

```javascript
const smp = new SpeedMeasurePlugin({
  compareLoadersBuild: {
    filePath: "./buildInfo.json",
  },
});
```

### `options.granularLoaderData` _(experimental)_

Type: `Boolean`<br>
Default: `false`

By default, SMP measures loaders in groups. If truthy, this plugin will give per-loader timing information.

This flag is _experimental_. Some loaders will have inaccurate results:

- loaders using separate processes (e.g. `thread-loader`)
- loaders emitting file output (e.g. `file-loader`)

We will find solutions to these issues before removing the _(experimental)_ flag on this option.

### `options.excludedLoaders`

Type: `Array<String|RegExp>`<br>
Default: `[]`

When you enable `granularLoaderData`, SMP prepends its timing loader to each matching
loader rule. Use this option to skip rules whose loader chain contains a matching
loader name or regular expression. String matching checks both the original loader
request and the normalized package name. E.g.

```javascript
const smp = new SpeedMeasurePlugin({
  granularLoaderData: true,
  excludedLoaders: ["thread-loader", /mini-css-extract-plugin/],
});
```

## FAQ

### What does general output time mean?

This tends to be down to webpack reading in from the file-system, but in general it's anything outside of what SMP can actually measure.

### What does modules without loaders mean?

It means vanilla JS files, which webpack can handle out of the box.

## Contributing

Contributors are welcome! 😊

Please check out the [CONTRIBUTING.md](./CONTRIBUTING.md).

## Migrating

SMP follows [semver](https://semver.org/). If upgrading a major version, you can consult [the migration guide](./migration.md).

## License

[MIT](/LICENSE)

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://stephencookdev.co.uk/"><img src="https://avatars.githubusercontent.com/u/8496655?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Stephen Cook</b></sub></a><br /><a href="https://github.com/stephencookdev/speed-measure-webpack-plugin/commits?author=stephencookdev" title="Code">💻</a> <a href="https://github.com/stephencookdev/speed-measure-webpack-plugin/commits?author=stephencookdev" title="Documentation">📖</a> <a href="#blog-stephencookdev" title="Blogposts">📝</a> <a href="#design-stephencookdev" title="Design">🎨</a> <a href="#question-stephencookdev" title="Answering Questions">💬</a> <a href="https://github.com/stephencookdev/speed-measure-webpack-plugin/pulls?q=is%3Apr+reviewed-by%3Astephencookdev" title="Reviewed Pull Requests">👀</a></td>
    <td align="center"><a href="https://scarletsky.github.io/"><img src="https://avatars.githubusercontent.com/u/2386165?v=4?s=100" width="100px;" alt=""/><br /><sub><b>scarletsky</b></sub></a><br /><a href="https://github.com/stephencookdev/speed-measure-webpack-plugin/commits?author=scarletsky" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/wayou"><img src="https://avatars.githubusercontent.com/u/3783096?v=4?s=100" width="100px;" alt=""/><br /><sub><b>牛さん</b></sub></a><br /><a href="https://github.com/stephencookdev/speed-measure-webpack-plugin/commits?author=wayou" title="Code">💻</a> <a href="https://github.com/stephencookdev/speed-measure-webpack-plugin/issues?q=author%3Awayou" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/ThomasHarper"><img src="https://avatars.githubusercontent.com/u/3199791?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Thomas Bentkowski</b></sub></a><br /><a href="https://github.com/stephencookdev/speed-measure-webpack-plugin/commits?author=ThomasHarper" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/alan-agius4"><img src="https://avatars.githubusercontent.com/u/17563226?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Alan Agius</b></sub></a><br /><a href="https://github.com/stephencookdev/speed-measure-webpack-plugin/commits?author=alan-agius4" title="Code">💻</a> <a href="https://github.com/stephencookdev/speed-measure-webpack-plugin/issues?q=author%3Aalan-agius4" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://daix.me/"><img src="https://avatars.githubusercontent.com/u/1396511?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ximing</b></sub></a><br /><a href="https://github.com/stephencookdev/speed-measure-webpack-plugin/commits?author=NdYAG" title="Code">💻</a> <a href="https://github.com/stephencookdev/speed-measure-webpack-plugin/issues?q=author%3ANdYAG" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://twitter.com/lihautan"><img src="https://avatars.githubusercontent.com/u/2338632?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Tan Li Hau</b></sub></a><br /><a href="https://github.com/stephencookdev/speed-measure-webpack-plugin/commits?author=tanhauhau" title="Code">💻</a> <a href="https://github.com/stephencookdev/speed-measure-webpack-plugin/issues?q=author%3Atanhauhau" title="Bug reports">🐛</a> <a href="https://github.com/stephencookdev/speed-measure-webpack-plugin/commits?author=tanhauhau" title="Tests">⚠️</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/ZauberNerd"><img src="https://avatars.githubusercontent.com/u/249542?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Björn Brauer</b></sub></a><br /><a href="https://github.com/stephencookdev/speed-measure-webpack-plugin/commits?author=ZauberNerd" title="Code">💻</a> <a href="https://github.com/stephencookdev/speed-measure-webpack-plugin/issues?q=author%3AZauberNerd" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/The-Only-Matrix"><img src="https://avatars.githubusercontent.com/u/61681157?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Suraj Patel</b></sub></a><br /><a href="https://github.com/stephencookdev/speed-measure-webpack-plugin/commits?author=The-Only-Matrix" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/hanzooo"><img src="https://avatars.githubusercontent.com/u/16368939?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jm</b></sub></a><br /><a href="https://github.com/stephencookdev/speed-measure-webpack-plugin/commits?author=hanzooo" title="Code">💻</a> <a href="https://github.com/stephencookdev/speed-measure-webpack-plugin/issues?q=author%3Ahanzooo" title="Bug reports">🐛</a> <a href="https://github.com/stephencookdev/speed-measure-webpack-plugin/commits?author=hanzooo" title="Tests">⚠️</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
