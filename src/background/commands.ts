import { backend } from './backend';
import {
    AutoFillArg,
    ContentScriptMessage,
    ContentScriptReturn
} from 'common/content-script-interface';
import { BackendConnectionState } from 'common/backend-connection-state';
import { activateTab } from './utils';

function startCommandListener(): void {
    chrome.commands.onCommand.addListener(async (command, tab) => {
        await runCommand(command, tab, tab.url);
    });
}

async function runCommand(command: string, tab: chrome.tabs.Tab, url: string): Promise<void> {
    if (!/^https?:/i.test(url)) {
        return;
    }

    await backend.connect();
    await activateTab(tab);

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
        const nextCommand = await getNextAutoFillCommand(tab, url);
        if (nextCommand) {
            await runCommand(nextCommand, tab, url);
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

    await autoFill(tab, url, {
        text: options.username ? user : options.password ? pass : undefined,
        password: options.username ? (options.password ? pass : undefined) : undefined,
        submit: options.submit
    });
}

async function getNextAutoFillCommand(tab: chrome.tabs.Tab, url: string): Promise<string> {
    const resp = await sendMessageToTab(tab, url, { url, getNextAutoFillCommand: true });
    return resp?.nextCommand;
}

async function autoFill(
    tab: chrome.tabs.Tab,
    url: string,
    options: AutoFillArg
): Promise<ContentScriptReturn> {
    return await sendMessageToTab(tab, url, { url, autoFill: options });
}

async function sendMessageToTab(
    tab: chrome.tabs.Tab,
    url: string,
    message: ContentScriptMessage
): Promise<ContentScriptReturn> {
    if (tab.url === url) {
        await injectPageContentScript();
        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tab.id, message, (resp) => {
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
