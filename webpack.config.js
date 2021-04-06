import path from 'path';
import fs from 'fs';
import CopyPlugin from 'copy-webpack-plugin';

const dev = process.argv.includes('--mode=development');

// eslint-disable-next-line import/no-default-export,no-restricted-syntax
export default {
    entry: {
        'background': './src/background/init.ts',
        'content-keeweb': './src/content/content-keeweb.ts',
        'content-page': './src/content/content-page.ts',
        'options': './src/options/index.tsx'
    },
    output: {
        filename: 'js/[name].js',
        path: path.resolve('dist')
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        alias: {
            background: path.resolve('src/background'),
            common: path.resolve('src/common'),
            content: path.resolve('src/content'),
            options: path.resolve('src/options')
        },
        extensions: ['.tsx', '.ts', '.js']
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: '_locales', to: '_locales' },
                { from: 'icons', to: 'icons' },
                { from: 'pages', to: 'pages' },
                { from: 'styles', to: 'styles' },
                {
                    from: 'manifest.json',
                    transform: (content) => {
                        if (dev) {
                            const manifest = JSON.parse(content.toString());
                            const devManifest = JSON.parse(
                                fs.readFileSync('manifest.dev.json', 'utf8')
                            );
                            for (const [key, value] of Object.entries(devManifest)) {
                                manifest[key] = value;
                            }
                            const str = JSON.stringify(manifest, null, 2);
                            content = Buffer.from(str, 'utf8');
                        }
                        return content;
                    }
                }
            ]
        })
    ]
};
