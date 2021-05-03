import * as https from 'https';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const keys: { public: string; secret: string } = require('../../keys/onesky.json');

const USE_FILES = true;
const PROJECT_ID = '382232';
const API_URL_TRANSLATIONS =
    'https://platform.api.onesky.io/1/projects/:project_id/translations/multilingual';
const API_URL_LANGUAGES = 'https://platform.api.onesky.io/1/projects/:project_id/languages';
const PHRASE_COUNT_THRESHOLD_PERCENT = 75;
const CACHE_DIR = path.resolve(__dirname, '..', '.cache');
const CACHE_FILE_LANGUAGES = path.join(CACHE_DIR, 'languages.json');
const CACHE_FILE_TRANSLATIONS = path.join(CACHE_DIR, 'translations.json');
const LANGUAGES_WITH_LOCALES = new Set('pt');

const ts = Math.floor(Date.now() / 1000).toString();

const hashStr = ts + keys.secret;
const hash = crypto.createHash('md5').update(hashStr).digest('hex');
const urlParams = new Map([
    ['api_key', keys.public],
    ['timestamp', ts],
    ['dev_hash', hash],
    ['source_file_name', 'messages.json'],
    ['file_format', 'I18NEXT_MULTILINGUAL_JSON']
]);

interface Language {
    code: string;
    english_name: string;
    local_name: string;
    custom_locale: null;
    locale: string;
    region: string;
    is_base_language: boolean;
    is_ready_to_publish: boolean;
    translation_progress: string;
    last_updated_at: string;
    last_updated_at_timestamp: number;
}

interface Languages {
    data: Language[];
}

interface Translations {
    [language: string]: { translation: { [key: string]: { message: string | string[] } } };
}

(async () => {
    if (USE_FILES) {
        fs.mkdirSync(CACHE_DIR, { recursive: true });
    }

    const languages = await loadLanguages();
    console.log(`Loaded ${languages.data.length} languages`);

    const translations = await loadTranslations();
    console.log(`Loaded ${Object.keys(translations).length - 1} translated languages`);

    saveTranslations(languages, translations);
})().catch((e) => console.error(e));

async function loadLanguages(): Promise<Languages> {
    if (USE_FILES && fs.existsSync(CACHE_FILE_LANGUAGES)) {
        console.log('Using cached languages');
        return JSON.parse(fs.readFileSync(CACHE_FILE_LANGUAGES, 'utf8'));
    }

    console.log('Loading language names...');

    const url = new URL(API_URL_LANGUAGES.replace(':project_id', PROJECT_ID));
    for (const [key, value] of urlParams) {
        url.searchParams.set(key, value);
    }

    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                console.error(`API error ${res.statusCode}`);
                return;
            }
            const data: Buffer[] = [];
            res.on('error', reject);
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    return reject(new Error(`API error ${res.statusCode}`));
                }
                try {
                    const json = Buffer.concat(data).toString('utf8');
                    const parsed = JSON.parse(json);
                    fs.writeFileSync(CACHE_FILE_LANGUAGES, JSON.stringify(parsed, null, 2));
                    resolve(parsed);
                } catch (e) {
                    reject(e);
                }
            });
        });
    });
}

async function loadTranslations(): Promise<Translations> {
    if (USE_FILES && fs.existsSync(CACHE_FILE_TRANSLATIONS)) {
        console.log('Using cached translations');
        return Promise.resolve(JSON.parse(fs.readFileSync(CACHE_FILE_TRANSLATIONS, 'utf8')));
    }
    console.log('Loading translations...');
    const url = new URL(API_URL_TRANSLATIONS.replace(':project_id', PROJECT_ID));
    for (const [key, value] of urlParams) {
        url.searchParams.set(key, value);
    }
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error(`API error ${res.statusCode}`));
            }
            const data: Buffer[] = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => {
                try {
                    const json = Buffer.concat(data).toString('utf8');
                    const parsed = JSON.parse(json);
                    fs.writeFileSync(CACHE_FILE_TRANSLATIONS, JSON.stringify(parsed, null, 2));
                    resolve(parsed);
                } catch (e) {
                    reject(e);
                }
            });
        });
    });
}

function saveTranslations(languages: Languages, translations: Translations) {
    let writtenCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    const enUs = translations['en-US'].translation;
    const totalPhraseCount = Object.keys(enUs).length;
    for (const language of languages.data) {
        const lang = language.code;
        let langErrors = 0;
        const languageTranslations = translations[lang]?.translation;
        if (lang === 'en-US' || !languageTranslations) {
            continue;
        }
        const langPhraseCount = Object.keys(languageTranslations).length;
        const percentage = Math.round((langPhraseCount / totalPhraseCount) * 100);
        let skip = percentage >= PHRASE_COUNT_THRESHOLD_PERCENT ? null : 'SKIP';

        const fileLang = LANGUAGES_WITH_LOCALES.has(lang) ? lang : language.locale;
        const languageFileName = path.resolve(__dirname, `../_locales/${fileLang}/messages.json`);
        let languageJson = JSON.stringify(languageTranslations, null, 2);
        if (!skip && fs.existsSync(languageFileName)) {
            const oldJson = fs.readFileSync(languageFileName, { encoding: 'utf8' });
            if (oldJson === languageJson) {
                skip = 'NO CHANGES';
            }
        }

        const action = skip ? `\x1b[35m${skip}\x1b[0m` : '\x1b[36mOK\x1b[0m';

        console.log(
            `[${lang}] ${langPhraseCount} / ${totalPhraseCount} (${percentage}%) -> ${action}`
        );

        if (skip) {
            skipCount++;
        } else {
            for (const name of Object.keys(languageTranslations)) {
                let text = languageTranslations[name].message;
                let enText = enUs[name].message;
                if (Array.isArray(text)) {
                    if (!Array.isArray(enText)) {
                        languageTranslations[name].message = text.join('\n');
                        console.error(`[${lang}]    \x1b[31mERROR:ARRAY\x1b[0m ${name}`);
                        enText = [enText];
                        langErrors++;
                    }
                    text = text.join('\n');
                }
                if (Array.isArray(enText)) {
                    enText = enText.join('\n');
                }
                if (!enText) {
                    console.warn(`[${lang}] SKIP ${name}`);
                    delete languageTranslations[name];
                    continue;
                }
                const textMatches = text.match(/"/g);
                const textMatchesCount = (textMatches && textMatches.length) || 0;
                const enTextMatches = enText.match(/"/g);
                const enTextMatchesCount = (enTextMatches && enTextMatches.length) || 0;
                if (enTextMatchesCount !== textMatchesCount) {
                    const textHl = text.replace(/"/g, '\x1b[33m"\x1b[0m');
                    console.warn(`[${lang}]    \x1b[33mWARN:"\x1b[0m ${name}: ${textHl}`);
                }
                if (/[<>&]/.test(text)) {
                    const textHl = text.replace(/([<>&])/g, '\x1b[31m$1\x1b[0m');
                    console.error(`[${lang}]    \x1b[31mERROR:<>\x1b[0m ${name}: ${textHl}`);
                    langErrors++;
                }
                if (text.indexOf('{}') >= 0 && enText.indexOf('{}') < 0) {
                    const textHl = text.replace(/{}/g, '\x1b[31m{}\x1b[0m');
                    console.error(`[${lang}]    \x1b[31mERROR:{}\x1b[0m ${name}: ${textHl}`);
                    langErrors++;
                }
                if (enText.indexOf('{}') >= 0 && text.indexOf('{}') < 0) {
                    const enTextHl = enText.replace(/{}/g, '\x1b[31m{}\x1b[0m');
                    console.error(
                        `[${lang}]    \x1b[31mERROR:NO{}\x1b[0m ${name}: ${text} <--> ${enTextHl}`
                    );
                    langErrors++;
                }
                const misspelledKeeWebRe = /(ke[^e]?web|k[^e]eweb)/gi;
                if (misspelledKeeWebRe.test(text)) {
                    const textHl = text.replace(misspelledKeeWebRe, '\x1b[31m$1\x1b[0m');
                    console.error(`[${lang}]    \x1b[31mERROR:{}\x1b[0m ${name}: ${textHl}`);
                    langErrors++;
                }
                if (text.match(/keeweb/gi)?.some((m) => m !== 'KeeWeb')) {
                    const textHl = text.replace(/(keeweb)/gi, '\x1b[31m$1\x1b[0m');
                    console.error(`[${lang}]    \x1b[31mERROR:{}\x1b[0m ${name}: ${textHl}`);
                    langErrors++;
                }
            }

            if (!langErrors) {
                writtenCount++;
                languageJson = JSON.stringify(languageTranslations, null, 2);
                fs.mkdirSync(path.dirname(languageFileName));
                fs.writeFileSync(languageFileName, languageJson);
            }

            if (langErrors) {
                errorCount++;
            }
        }
    }
    console.log(`Done: ${writtenCount} written, ${skipCount} skipped, ${errorCount} errors`);
    if (errorCount) {
        console.error('There were errors, please check the output.');
        process.exit(1);
    }
}
