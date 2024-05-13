const { merge } = require('webpack-merge');
const baseConfig = require('./base.config');

module.exports = merge(baseConfig, {
    mode: 'development',
    devServer: {
        historyApiFallback: {
            index: '/peer-to-peer-messaging',
        },
        open: '/peer-to-peer-messaging',
    },
});
