declare global {
    interface Window {
        kwExtensionInstalled: boolean;
    }
}

interface KeeWebConnectTabMessage {
    kwConnect?: string;
}

if (!window.kwExtensionInstalled) {
    window.kwExtensionInstalled = true;

    chrome.runtime.onConnect.addListener((port) => {
        if (port.sender?.id !== chrome.runtime.id) {
            return;
        }
        if (!port.name) {
            return;
        }

        const onWindowMessage = (e: MessageEvent) => {
            if (e.origin !== location.origin) {
                return;
            }
            if (e.source !== window) {
                return;
            }
            const data = e?.data as KeeWebConnectTabMessage;
            if (data?.kwConnect === 'response') {
                delete data.kwConnect;
                port.postMessage(e.data);
            }
        };

        window.addEventListener('message', onWindowMessage);
        port.onDisconnect.addListener(() => {
            window.removeEventListener('message', onWindowMessage);
        });
        port.onMessage.addListener((msg: KeeWebConnectTabMessage) => {
            msg.kwConnect = 'request';
            window.postMessage(msg, window.location.origin);
        });
    });
}

export {};
