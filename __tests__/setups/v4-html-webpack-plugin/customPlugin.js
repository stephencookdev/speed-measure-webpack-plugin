const pluginName = 'CustomPlugin'

class CustomPlugin {
    apply(compiler) {
        compiler.hooks.compilation.tap(pluginName, compilation => {
            compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing.tap(pluginName, resourceData => {
                console.log(resourceData)
            })
        })
    }
}

module.exports = CustomPlugin