import { backend } from './backend';
import { createUIMenus, bindExtensionButtonClick } from './ui';
import { startInternalIpc } from './internal-ipc';
import { startCommandListener } from './commands';

chrome.runtime.onStartup.addListener(start);
chrome.runtime.onInstalled.addListener(async (e) => {
    await start();
    if (e.reason === 'install') {
        chrome.runtime.openOptionsPage();
    }
});

async function start() {
    startCommandListener();
    createUIMenus();
    bindExtensionButtonClick();
    startInternalIpc();

    await backend.init();
}
