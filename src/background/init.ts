import { backend } from './backend';
import { createUIMenus, bindExtensionButtonClick } from './ui';
import { startInternalIpc } from './internal-ipc';
import { startCommandListener } from './commands';
import { BackendConnectionState } from 'common/backend-connection-state';

chrome.runtime.onStartup.addListener(start);
chrome.runtime.onInstalled.addListener(async (e) => {
    await start();
    if (e.reason === 'install') {
        openSettingsIfNotConfigured();
    }
});

async function start() {
    startCommandListener();
    createUIMenus();
    bindExtensionButtonClick();
    startInternalIpc();

    await backend.init();
}

function openSettingsIfNotConfigured() {
    if (backend.state === BackendConnectionState.NotConfigured) {
        chrome.runtime.openOptionsPage();
    }
}
