import * as fs from 'fs';

const releaseNotes = fs.readFileSync('release-notes.md', 'utf8');
const match = /^#####\s+v(\d+\.\d+\.\d+)\s/m.exec(releaseNotes);

if (!match) {
    throw new Error('Cannot find version in release notes');
}
const version = match[1];

console.log('Version:', version);

replaceInJson('package.json');
replaceInJson('package-lock.json');
replaceInJson('manifest.json');
replaceInText('xcode/KeeWeb Connect.xcodeproj/project.pbxproj', (text) => {
    let found = 0;

    text = text.replace(/MARKETING_VERSION\s*=\s*[\d.]+;/g, () => {
        found++;
        return `MARKETING_VERSION = ${version};`;
    });
    if (found !== 4) {
        throw new Error(`Found ${found} MARKETING_VERSION's, expected 4`);
    }

    found = 0;
    let lastBuildVersion = 0;
    text = text.replace(/CURRENT_PROJECT_VERSION\s*=\s*\d+;/g, (match) => {
        const currentVersion = +(/\d+/.exec(match)?.[0] || 0);
        if (!currentVersion) {
            throw new Error('Current version not found in the Xcode project');
        }
        if (lastBuildVersion) {
            if (lastBuildVersion !== currentVersion) {
                throw new Error(
                    `Xcode project versions don't match: ${lastBuildVersion} <> ${currentVersion}`
                );
            }
        } else {
            lastBuildVersion = currentVersion;
        }
        found++;
        return `CURRENT_PROJECT_VERSION = ${lastBuildVersion + 1};`;
    });
    if (found !== 4) {
        throw new Error(`Found ${found} CURRENT_PROJECT_VERSION's, expected 4`);
    }

    return text;
});

console.log('Done');

function replaceInJson(fileName: string) {
    replaceInText(fileName, (json) => {
        const data = JSON.parse(json);
        data.version = version;
        return JSON.stringify(data, null, 2);
    });
}

function replaceInText(fileName: string, replace: (data: string) => string) {
    const data = fs.readFileSync(fileName, 'utf8');
    fs.writeFileSync(fileName, replace(data));
}
