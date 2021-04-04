import { OptionsPageMessage } from 'common/options-page-interface';
import { backend } from './backend';
import { BackgroundMessageFromPage } from '../common/background-interface';

const connectedPorts = new Map<string, chrome.runtime.Port>();

function startInternalIpc(): void {
    chrome.runtime.onConnect.addListener((port) => {
        if (port.sender.origin !== location.origin) {
            return;
        }
        if (
            !port.sender.url?.startsWith(port.sender.origin) ||
            !port.sender.tab?.url?.startsWith(port.sender.origin)
        ) {
            return;
        }

        if (!port.name) {
            return;
        }

        connectedPorts.set(port.name, port);

        port.onMessage.addListener((message) =>
            processMessage(message as BackgroundMessageFromPage)
        );
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

function processMessage(message: BackgroundMessageFromPage) {
    if (message.connectToKeeWeb) {
        backend.connect();
    }
}

function sendFirstMessage(port: chrome.runtime.Port) {
    const msg: OptionsPageMessage = {
        backendConnectionState: backend.state,
        backendConnectionError: backend.connectionError
    };
    port.postMessage(msg);
}

export { startInternalIpc };
