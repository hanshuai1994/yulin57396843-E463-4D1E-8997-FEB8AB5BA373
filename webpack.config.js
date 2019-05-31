// 基于node语法 遵循commonjs规范

const path = require('path');
const webpack = require('webpack'); // 引入 webpack 插件

const HtmlWebpackPlugin = require('html-webpack-plugin'); // 引入 html 模板插件
const CleanWebpackPlugin = require('clean-webpack-plugin'); // 引入清空文件夹插件
const ExtractTextWebpackPlugin = require('extract-text-webpack-plugin'); // 引入抽离文本插件（抽离css）
const LessExtract = new ExtractTextWebpackPlugin('css/less.css');
const CssExtract = new ExtractTextWebpackPlugin('css/css.css');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// 单页 index.html 引用了多个 js
// 多页 a.html => index.js   b.html => a.js

module.exports = {
    entry: './src/index.js', // 单入口
    // entry: ['./src/index.js', './src/a.js'], // 多入口打包到一个出口
    // entry: { // 对应多出口的多入口标记设置
    //     index: './src/index.js',
    //     a: './src/a.js',
    // },
    output: {
        filename: 'bundle.[hash:8].js', // 制定打包后的文件名
        // filename: '[name].[hash:8].js', // 使用预先设置的文件名
        path: path.resolve('./build'), // 路径为绝对路径
    }, // 出口
    devServer: {
        contentBase: './build', // 服务器启动目录
        port: 3000, // 配置端口
        compress: true, // 服务器压缩
        open: true, // 自动打开浏览器
        // hot: true, // 热更新
    }, // 开发服务器
    module: {
        rules: [ // 从右往左写
            {
                test: /\.css$/, // 对以.css结尾的文件运行以下规则
                use: CssExtract.extract({
                    use: [{
                        loader: 'css-loader' // 解析 css 文件
                    }]
                })
            },
            {
                test: /\.less$/, // 对以.less结尾的文件运行以下规则
                use: LessExtract.extract({
                    use: [{
                            loader: 'css-loader' // 解析 css 文件
                        },
                        {
                            loader: 'less-loader' // 解析 less 文件
                        }
                    ]
                })
            },
            {
                test: /\.(jpg|png|gif)$/,
                loader: 'url-loader?limit=8192&name=images/[hash:8].[name].[ext]'
            },
            {
                test: /\.(ttf|eot|woff|woff2|svg)$/,
                loader: 'file-loader',
                options: {
                    outputPath: 'file',
                },
            },
        ]
    }, // 模块配置
    plugins: [
        // 文件复制插件
        new CopyWebpackPlugin([
            {
                from: './src/img',
                to: 'img'
            },
            // {
            //     from: './src/laydate/theme',
            //     to: 'theme'
            // },
            {
                from: './src/models',
                to: 'models'
            },
            {
                from: './src/data',
                to: 'data'
            },
        ]),

        // 热更新插件
        new webpack.HotModuleReplacementPlugin(),

        CssExtract, // css 文本抽离
        LessExtract, // less 文本抽离

        new webpack.ProgressPlugin(),

        // 补全缺失的引用
        new webpack.ProvidePlugin({
            "$": "jquery",
            "jQuery": "jquery",
            "window.jQuery": "jquery",
            "THREE": "three",
        }),

        // 打包成到单个html
        new HtmlWebpackPlugin({ // 打包html插件
            template: './src/index.html', // 打包的原始模板
            title: 'webpack测试', // 可修改模板中对应格式的值
            hash: true, // 用来添加文件标记的哈希值
            minify: { // 对生成的html文件进行压缩
                collapseWhitespace: true, // 折叠空行
                removeAttributeQuotes: true, // 删除属性引号
                removeComments: true, // 删除注释
                minifyCSS: true, // 压缩html内的样式
                minifyJS: true, // 压缩html内的js
            }
        }),

        new CleanWebpackPlugin(), // 清空之前打包生成的文件
    ], // 插件的配置
    mode: 'development', // 可以更改模式
    // mode: 'production', // 可以更改模式
    resolve: {}, // 配置解析
}

// 1. 在webpack中如何配置开发服务器 webpack-dev-server

// 2. webpack插件 1将 html 打包到出口文件夹下，可以自动引入生产的 js

// 3. 抽离样式 抽离到一个 css 文件， 通过 css 文件的方式来引用