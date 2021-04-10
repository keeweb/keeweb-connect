import { TransportBase } from './transport-base';
import { KeeWebConnectRequest, KeeWebConnectResponse } from 'background/protocol/types';

class TransportNativeMessaging extends TransportBase {
    private readonly _appName = 'net.antelle.keeweb.keeweb_connect';
    private _port: chrome.runtime.Port;

    connect(): Promise<void> {
        this._port = chrome.runtime.connectNative(this._appName);

        this._port.onDisconnect.addListener(() => this.portDisconnected());
        this._port.onMessage.addListener((msg) => this.portMessage(msg));

        return Promise.resolve();
    }

    disconnect(): Promise<void> {
        return new Promise((resolve) => {
            this._port?.disconnect();
            if (this._port) {
                this.portDisconnected();
            }
            resolve();
        });
    }

    request(message: KeeWebConnectRequest): void {
        this._port?.postMessage(message);
    }

    focusKeeWeb(): void {
        // not needed, desktop apps can handle focus themselves
    }

    private portDisconnected() {
        if (this._port) {
            this._port = undefined;
            this.emit('disconnected', chrome.runtime.lastError?.message);
        }
    }

    private portMessage(msg: KeeWebConnectResponse) {
        this.emit('message', msg);
    }
}

export { TransportNativeMessaging };
