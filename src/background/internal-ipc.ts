import { OptionsPageMessage } from 'common/options-page-interface';
import { backend } from './backend';
import { BackgroundMessageFromPage } from 'common/background-interface';
import { activateTab, openTab } from './utils';
import { noop } from 'common/utils';

const connectedPorts = new Map<string, chrome.runtime.Port>();

function startInternalIpc(): void {
    chrome.runtime.onConnect.addListener((port) => {
        const senderUrl = port.sender?.url || port.sender?.tab?.url || '';

        // on Safari, case in extension ID will be different
        if (!senderUrl.toLowerCase().startsWith(location.origin)) {
            return;
        }

        if (!port.name) {
            return;
        }

        connectedPorts.set(port.name, port);

        port.onMessage.addListener(async (message) => {
            await processMessage(message as BackgroundMessageFromPage);
        });
        port.onDisconnect.addListener(() => {
            connectedPorts.delete(port.name);
        });

        sendFirstMessage(port);
    });

    backend.on('state-changed', () => {
        for (const port of connectedPorts.values()) {
            const msg: OptionsPageMessage = {
                backendConnectionState: backend.state,
                backendConnectionError: backend.connectionError
            };
            port.postMessage(msg);
        }
    });
}

async function processMessage(message: BackgroundMessageFromPage) {
    if (message.connectToKeeWeb) {
        await backend.connect().catch(noop);
        await activateTab(message.connectToKeeWeb.activeTabId);
    } else if (message.openTab) {
        await openTab(message.openTab);
    }
}

function sendFirstMessage(port: chrome.runtime.Port) {
    const msg: OptionsPageMessage = {
        backendConnectionState: backend.state,
        backendConnectionError: backend.connectionError
    };
    port.postMessage(msg);
    backend.checkConnection();
}

export { startInternalIpc };
