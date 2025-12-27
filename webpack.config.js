/**
 * Webpack Configuration for Modular Frontend Architecture
 * Supports code splitting, optimization, and development/production builds
 */

import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default (env, argv) => {
    const isProduction = argv.mode === 'production';
    const isDevelopment = !isProduction;

    return {
        // Entry points for different parts of the application
        entry: {
            // CSS entry points - imported first for proper cascading
            'css/base': [
                './src/assets/styles/base/reset.css',
                './src/assets/styles/base/variables.css',
                './src/assets/styles/base/typography.css',
                './src/assets/styles/base/base.css'
            ],
            'css/components': [
                './src/assets/styles/components/buttons.css',
                './src/assets/styles/components/notifications.css',
                './src/assets/styles/components/search.css'
            ],
            'css/home': './src/assets/styles/pages/home.css',
            'css/admin': './src/assets/styles/pages/admin.css',
            'css/review': './src/assets/styles/pages/review.css',

            // Main application entry point
            app: './src/app.js',

            // Page-specific entry points for code splitting
            home: './src/pages/home/home.page.js',
            admin: './src/pages/admin/admin.page.js'
        },

        // Output configuration
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: isProduction
                ? 'js/[name].[contenthash].js'
                : 'js/[name].js',
            chunkFilename: isProduction
                ? 'js/chunks/[name].[contenthash].js'
                : 'js/chunks/[name].js',
            publicPath: '/',
            clean: true
        },

        // Module resolution
        resolve: {
            extensions: ['.js', '.json'],
            alias: {
                '@': path.resolve(__dirname, 'src'),
                '@core': path.resolve(__dirname, 'src/core'),
                '@services': path.resolve(__dirname, 'src/services'),
                '@components': path.resolve(__dirname, 'src/components'),
                '@pages': path.resolve(__dirname, 'src/pages'),
                '@state': path.resolve(__dirname, 'src/state'),
                '@assets': path.resolve(__dirname, 'src/assets')
            }
        },

        // Module rules
        module: {
            rules: [
                // JavaScript files
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                ['@babel/preset-env', {
                                    targets: {
                                        browsers: ['> 1%', 'last 2 versions', 'not ie <= 11']
                                    },
                                    modules: false,
                                    useBuiltIns: false
                                }]
                            ],
                            plugins: [
                                ['@babel/plugin-transform-runtime', {
                                    helpers: true,
                                    regenerator: true,
                                    absoluteRuntime: false
                                }],
                                '@babel/plugin-syntax-dynamic-import'
                            ]
                        }
                    }
                },

                // CSS files - Updated for modular architecture
                {
                    test: /\.css$/,
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader,
                            options: {
                                publicPath: '../'
                            }
                        },
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 1,
                                sourceMap: isDevelopment,
                                modules: false // Disable CSS modules for our BEM approach
                            }
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                sourceMap: isDevelopment,
                                postcssOptions: {
                                    plugins: [
                                        ['autoprefixer'],
                                        isProduction && ['cssnano', {
                                            preset: ['default', {
                                                discardComments: { removeAll: true },
                                                normalizeWhitespace: true,
                                                minifySelectors: true,
                                                minifyParams: true,
                                                minifyFontValues: true
                                            }]
                                        }]
                                    ].filter(Boolean)
                                }
                            }
                        }
                    ]
                },

                // Asset files
                {
                    test: /\.(png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'assets/[name].[contenthash][ext]'
                    }
                }
            ]
        },

        // Plugins
        plugins: [
            // Extract CSS into separate files
            new MiniCssExtractPlugin({
                filename: isProduction ? 'js/css/[name].[contenthash].css' : 'js/css/[name].css',
                chunkFilename: isProduction ? 'js/css/[id].[contenthash].css' : 'js/css/[id].css'
            }),

            // Clean output directory
            new CleanWebpackPlugin(),

            // Copy static assets
            new CopyPlugin({
                patterns: [
                    {
                        from: 'index.html',
                        to: 'index.html',
                        transform: (content) => {
                            // Update HTML to use built assets
                            return content.toString()
                                .replace(/<script type="module" src="src\/app\.js"><\/script>/,
                                        '<script src="js/app.js"></script>')
                                .replace(/<link rel="stylesheet" href="css\/style\.css"/,
                                        '<link rel="stylesheet" href="css/style.css"');
                        }
                    },
                    {
                        from: 'admin.html',
                        to: 'admin.html'
                    },
                    {
                        from: 'review.html',
                        to: 'review.html'
                    },
                    {
                        from: 'css/',
                        to: 'css/',
                        globOptions: {
                            ignore: ['**/*.map']
                        }
                    },
                    {
                        from: 'data/',
                        to: 'data/',
                        noErrorOnMissing: true
                    }
                ]
            })
        ],

        // Optimization
        optimization: {
            // Code splitting
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    // Vendor chunks
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all',
                        priority: 10
                    },

                    // Core modules
                    core: {
                        test: /[\\/]src[\\/]core[\\/]/,
                        name: 'core',
                        chunks: 'all',
                        priority: 20
                    },

                    // Services
                    services: {
                        test: /[\\/]src[\\/]services[\\/]/,
                        name: 'services',
                        chunks: 'all',
                        priority: 15
                    },

                    // Components
                    components: {
                        test: /[\\/]src[\\/]components[\\/]/,
                        name: 'components',
                        chunks: 'all',
                        priority: 15
                    }
                }
            },

            // Minimization
            minimize: isProduction,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        compress: {
                            drop_console: isProduction,
                            drop_debugger: isProduction
                        }
                    }
                }),
                new CssMinimizerPlugin()
            ]
        },

        // Development server
        devServer: {
            contentBase: path.join(__dirname, 'dist'),
            compress: true,
            port: 8080,
            hot: true,
            historyApiFallback: true,
            proxy: {
                '/api': {
                    target: 'http://localhost:3000',
                    changeOrigin: true,
                    secure: false
                }
            }
        },

        // Development tools
        devtool: isDevelopment ? 'eval-cheap-module-source-map' : 'source-map',

        // Performance
        performance: {
            hints: isProduction ? 'warning' : false,
            maxAssetSize: 512 * 1024, // 512KB
            maxEntrypointSize: 512 * 1024 // 512KB
        },

        // Build stats
        stats: {
            colors: true,
            modules: false,
            chunks: false,
            chunkModules: false,
            children: false,
            entrypoints: true,
            assets: true
        }
    };
};
