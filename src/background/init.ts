import { backend } from './backend';
import { createUIMenus, bindExtensionButtonClick } from './ui';
import { startInternalIpc } from './internal-ipc';
import { startCommandListener } from './commands';
import { noop } from 'common/utils';

let started = false;

chrome.runtime.onStartup.addListener(startAndReportError);
chrome.runtime.onInstalled.addListener((e) => {
    const openOptions = e.reason === 'install';
    startAndReportError(openOptions);
});

startAndReportError();

function startAndReportError(openOptions?: boolean) {
    if (started) {
        return;
    }
    started = true;
    try {
        start().catch(noop);
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Startup error', e);
    }
    if (openOptions) {
        chrome.runtime.openOptionsPage();
    }
}

async function start() {
    startCommandListener();
    createUIMenus();
    bindExtensionButtonClick();
    startInternalIpc();

    await backend.init();
}
