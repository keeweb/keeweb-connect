if (!chrome.runtime.onConnect.hasListeners()) {
    chrome.runtime.onConnect.addListener((port) => {
        if (port.sender.id !== chrome.runtime.id) {
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
            if (e?.data?.kwConnect === 'response') {
                delete e.data.kwConnect;
                port.postMessage(e.data);
            }
        };

        window.addEventListener('message', onWindowMessage);
        port.onDisconnect.addListener(() => {
            window.removeEventListener('message', onWindowMessage);
        });
        port.onMessage.addListener((msg) => {
            msg.kwConnect = 'request';
            window.postMessage(msg, window.location.origin);
        });
    });
}
