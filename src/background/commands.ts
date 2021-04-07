import { backend } from './backend';
import { getActiveTab } from './utils';
import {
    AutoFillArg,
    ContentScriptMessage,
    ContentScriptReturn
} from 'common/content-script-interface';
import { BackendConnectionState } from 'common/backend-connection-state';

function startCommandListener(): void {
    chrome.commands.onCommand.addListener(async (command) => {
        const activeTab = await getActiveTab();
        if (activeTab?.url) {
            await runCommand(command, activeTab.url);
        }
    });
}

async function runCommand(command: string, url: string): Promise<void> {
    if (!/^https?:/i.test(url)) {
        return;
    }

    await backend.connect();
    if (backend.state !== BackendConnectionState.Connected) {
        chrome.runtime.openOptionsPage();
    }

    if (url.startsWith(backend.keeWebUrl)) {
        return;
    }

    const options = {
        auto: command.includes('auto'),
        username: command.includes('username'),
        password: command.includes('password'),
        submit: command.includes('submit'),
        other: command.includes('other')
    };

    if (options.auto) {
        const nextCommand = await getNextAutoFillCommand(url);
        if (nextCommand) {
            await runCommand(nextCommand, url);
        }
        return;
    }

    if (options.other) {
        // not implemented
        return;
    }

    const fieldsToGet = [];
    if (options.username) {
        fieldsToGet.push('UserName');
    }
    if (options.password) {
        fieldsToGet.push('Password');
    }

    const fieldValues = await backend.getFields(url, fieldsToGet);

    const user = fieldValues.get('UserName');
    const pass = fieldValues.get('Password');

    await autoFill(url, {
        text: options.username ? user : options.password ? pass : undefined,
        password: options.username ? (options.password ? pass : undefined) : undefined,
        submit: options.submit
    });
}

async function getNextAutoFillCommand(url: string): Promise<string> {
    const resp = await sendMessageToActiveTab(url, { url, getNextAutoFillCommand: true });
    return resp?.nextCommand;
}

async function autoFill(url: string, options: AutoFillArg): Promise<ContentScriptReturn> {
    return await sendMessageToActiveTab(url, { url, autoFill: options });
}

async function sendMessageToActiveTab(
    url: string,
    message: ContentScriptMessage
): Promise<ContentScriptReturn> {
    const activeTab = await getActiveTab();
    if (activeTab?.url === url) {
        await injectPageContentScript();
        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(activeTab.id, message, (resp) => {
                if (chrome.runtime.lastError) {
                    const msg = `Cannot send message to page: ${chrome.runtime.lastError.message}`;
                    return reject(new Error(msg));
                }
                resolve(resp);
            });
        });
    }
}

function injectPageContentScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        chrome.tabs.executeScript({ file: 'js/content-page.js' }, () => {
            if (chrome.runtime.lastError) {
                const msg = `Page script injection error: ${chrome.runtime.lastError.message}`;
                return reject(new Error(msg));
            }
            resolve();
        });
    });
}

export { startCommandListener, runCommand };
