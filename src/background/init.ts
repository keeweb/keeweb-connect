import { backend } from './backend';
import { interceptHttpBasicAuth } from './httpAuth';
import { createUIMenus, bindExtensionButtonClick } from './ui';
import { startInternalIpc } from './internal-ipc';
import { startCommandListener } from './commands';
import { noop } from 'common/utils';

let startPromise: Promise<void>;

chrome.runtime.onStartup.addListener(startAndReportError);
chrome.runtime.onInstalled.addListener((e) => {
    startAndReportError()
        .then(() => {
            if (e.reason === 'install') {
                chrome.runtime.openOptionsPage();
            }
        })
        .catch(noop);
});

startAndReportError().catch(noop);

function startAndReportError(): Promise<void> {
    if (startPromise !== undefined) {
        return startPromise;
    }
    startPromise = start().catch((e) => {
        // eslint-disable-next-line no-console
        console.error('Startup error', e);
    });
    return startPromise;
}

async function start() {
    startCommandListener();
    createUIMenus();
    bindExtensionButtonClick();
    startInternalIpc();
    interceptHttpBasicAuth();

    await backend.init();
}
