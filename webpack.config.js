import path from 'path';
import fs from 'fs';
import merge from 'merge';
import CopyPlugin from 'copy-webpack-plugin';

const dev = process.argv.includes('--mode=development');

const knownBrowsers = {
    chrome: true,
    firefox: true,
    safari: true,
    edge: true
};

const browser = process.env.KW_BROWSER || 'chrome';
if (!knownBrowsers[browser]) {
    throw new Error(`Unknown browser: ${browser}`);
}

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
        path: path.resolve('dist', browser)
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
    optimization: {
        minimize: false
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: '_locales', to: '_locales' },
                { from: 'icons', to: 'icons' },
                { from: 'pages', to: 'pages' },
                { from: `img/${browser}`, to: 'img' },
                { from: 'styles', to: 'styles' },
                {
                    from: 'manifest.json',
                    transform: (content) => {
                        const manifest = JSON.parse(content.toString());
                        const patchFiles = [`manifest.${browser}.json`];
                        if (dev) {
                            patchFiles.push('manifest.dev.json');
                        }
                        for (const patchFile of patchFiles) {
                            if (!fs.existsSync(patchFile)) {
                                continue;
                            }
                            const patchData = JSON.parse(fs.readFileSync(patchFile, 'utf8'));
                            merge.recursive(manifest, patchData);
                        }
                        const str = JSON.stringify(manifest, null, 2);
                        content = Buffer.from(str, 'utf8');
                        return content;
                    }
                }
            ]
        })
    ]
};
