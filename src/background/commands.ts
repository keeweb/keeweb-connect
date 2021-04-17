import { backend } from './backend';
import {
    AutoFillArg,
    ContentScriptMessage,
    ContentScriptReturn
} from 'common/content-script-interface';
import { BackendConnectionState } from 'common/backend-connection-state';
import { activateTab } from './utils';

interface CommandArgs {
    command: string;
    tab: chrome.tabs.Tab;
    url?: string;
    frameId?: number;
}

interface Frame {
    id: number;
    url: string;
}

function startCommandListener(): void {
    chrome.commands.onCommand.addListener(async (command, tab) => {
        if (tab) {
            await runCommand({ command, tab });
        } else {
            [tab] = await new Promise<chrome.tabs.Tab[]>((resolve) =>
                chrome.tabs.query({ active: true }, resolve)
            );
            if (tab) {
                await runCommand({ command, tab });
            }
        }
    });
}

async function runCommand(args: CommandArgs): Promise<void> {
    await backend.connect();
    if (backend.state !== BackendConnectionState.Connected) {
        chrome.runtime.openOptionsPage();
        return;
    }

    await activateTab(args.tab.id);

    if (args.command.includes('auto')) {
        const nextCommand = await getNextAutoFillCommand(args);
        if (nextCommand) {
            await runCommand(nextCommand);
        }
        return;
    }

    if (!isValidUrl(args.url) || typeof args.frameId !== 'number') {
        return;
    }

    const options = {
        username: args.command.includes('username'),
        password: args.command.includes('password'),
        submit: args.command.includes('submit')
    };

    const fieldsToGet: string[] = [];
    if (options.username) {
        fieldsToGet.push('UserName');
    }
    if (options.password) {
        fieldsToGet.push('Password');
    }

    const fieldValues = await backend.getFields(args.url, fieldsToGet);

    const user = fieldValues.get('UserName');
    const pass = fieldValues.get('Password');

    await autoFill(args, {
        text: options.username ? user : options.password ? pass : undefined,
        password: options.username ? (options.password ? pass : undefined) : undefined,
        submit: options.submit
    });
}

function isValidUrl(url: string): boolean {
    return url && /^https?:/i.test(url) && !url.startsWith(backend.keeWebUrl);
}

async function getNextAutoFillCommand(args: CommandArgs): Promise<CommandArgs> {
    const frameCount = await injectPageContentScript(args.tab);
    let allFrames: Frame[];
    if (frameCount > 1) {
        allFrames = await getAllFrames(args.tab);
    } else {
        allFrames = [{ id: 0, url: args.tab.url }];
    }
    for (const frame of allFrames) {
        if (!isValidUrl(frame.url)) {
            continue;
        }
        const resp = await sendMessageToTab(args.tab, frame.id, {
            url: frame.url,
            getNextAutoFillCommand: true
        });
        if (resp?.nextCommand) {
            args.command = resp.nextCommand;
            args.frameId = frame.id;
            args.url = frame.url;
            return {
                command: resp.nextCommand,
                tab: args.tab,
                frameId: frame.id,
                url: frame.url
            };
        }
    }
}

async function getAllFrames(tab: chrome.tabs.Tab): Promise<Frame[]> {
    return new Promise((resolve, reject) => {
        chrome.webNavigation.getAllFrames({ tabId: tab.id }, (frames) => {
            if (chrome.runtime.lastError) {
                const msg = `Cannot get tab frames: ${chrome.runtime.lastError.message}`;
                return reject(new Error(msg));
            }
            resolve(frames.map((f) => ({ id: f.frameId, url: f.url })));
        });
    });
}

async function autoFill(args: CommandArgs, options: AutoFillArg): Promise<ContentScriptReturn> {
    return await sendMessageToTab(args.tab, args.frameId, { url: args.url, autoFill: options });
}

async function sendMessageToTab(
    tab: chrome.tabs.Tab,
    frameId: number,
    message: ContentScriptMessage
): Promise<ContentScriptReturn> {
    await injectPageContentScript(tab);
    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tab.id, message, { frameId }, (resp) => {
            if (chrome.runtime.lastError) {
                return resolve(undefined);
            }
            resolve(resp);
        });
    });
}

function injectPageContentScript(tab: chrome.tabs.Tab): Promise<number> {
    return new Promise((resolve) => {
        chrome.tabs.executeScript(
            tab.id,
            { file: 'js/content-page.js', allFrames: true },
            (results) => {
                if (chrome.runtime.lastError) {
                    return resolve(undefined);
                }
                resolve(results.length);
            }
        );
    });
}

export { startCommandListener, runCommand };
