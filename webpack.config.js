const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: __dirname + "/app/index.js",
    output: {
        path: __dirname + "/dist",
        filename: 'main.js'
    },
    module: {
        rules: [
            {
                test: /\.(sass|scss)$/,
                use: [{
                    loader: "style-loader"  
                }, {
                    loader: "css-loader"
                }, {
                    loader: "sass-loader"
                }]
            },
            { 
                test: /\.(js)$/, 
                use: 'babel-loader',  
                exclude: [/node_modules/, /mapbox-gl/] 
            },
            { 
                test: /\.(png|svg|jpg|gif)$/, 
                use: [ 'file-loader' ] 
            },
            {
                test: /min.css$/,  
                use: [ 'style-loader', 'css-loader' ]
            },
            {
                test: /.(woff|ttf|eot|woff2)$/, 
                use: [ 'file-loader' ] 
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: __dirname + "/app/index.html",
            inject: true
        }),
    ],
    devServer: {
        contentBase: './app',
        port: 77000
    },
    mode: 'production'
}