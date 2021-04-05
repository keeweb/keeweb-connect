import { backend } from './backend';
import { getActiveTab } from './utils';
import { AutoFillArg, ContentScriptMessage } from 'common/content-script-interface';
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
    await backend.connect();
    if (backend.state !== BackendConnectionState.Connected) {
        chrome.runtime.openOptionsPage();
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

async function getNextAutoFillCommand(url: string): Promise<string | undefined> {
    const activeTab = await getActiveTab();
    if (activeTab?.url === url) {
        return await new Promise((resolve) => {
            const arg: ContentScriptMessage = { url, getNextAutoFillCommand: true };
            chrome.tabs.sendMessage(activeTab.id, arg, (resp) => {
                if (chrome.runtime.lastError) {
                    // probably the tab is not listening yet
                    resolve(undefined);
                } else {
                    resolve(resp?.nextCommand);
                }
            });
        });
    }
}

async function autoFill(url: string, options: AutoFillArg): Promise<void> {
    const activeTab = await getActiveTab();
    if (activeTab?.url === url) {
        return await new Promise((resolve) => {
            const arg: ContentScriptMessage = { url, autoFill: options };
            chrome.tabs.sendMessage(activeTab.id, arg, (resp) => {
                if (chrome.runtime.lastError) {
                    // probably the tab is not listening yet
                    resolve();
                } else {
                    resolve(resp);
                }
            });
        });
    }
}

export { startCommandListener, runCommand };
