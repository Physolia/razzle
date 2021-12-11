
export default {
    plugins: ['webpack5', 'webpack5-externals', 'webpack5-babel'],
    modifyWebpackConfig: (
        razzleConfig,
        razzleContext,
        webpackOptions,
        webpackConfig
    ) => {
        console.log(webpackConfig);
        return webpackConfig

    }
}