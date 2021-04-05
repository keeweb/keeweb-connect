import { TransportBase } from './transport-base';
import { activateTab, getActiveTab } from 'background/utils';
import {
    KeeWebConnectMessage,
    KeeWebConnectPingRequest,
    KeeWebConnectPingResponse,
    KeeWebConnectRequest
} from 'common/keeweb-connect-protocol';

class TransportBrowserTab extends TransportBase {
    private readonly _keeWebUrl: string;
    private readonly _maxTabConnectionRetries = 10;
    private readonly _tabConnectionRetryMillis = 500;
    private readonly _tabConnectionTimeoutMillis = 500;
    private _tab: chrome.tabs.Tab;
    private _port: chrome.runtime.Port;

    constructor(keeWebUrl: string) {
        super();
        this._keeWebUrl = keeWebUrl;
    }

    async connect(): Promise<void> {
        const hasPermissions = await this.checkPermissions();
        if (!hasPermissions) {
            const msg = chrome.i18n.getMessage(
                'optionsErrorBrowserTabNoPermissions',
                this._keeWebUrl
            );
            this.emit('error', new Error(msg));
            return;
        }

        const activeTab = await getActiveTab();
        this._tab = await this.findOrCreateTab();
        if (!this._tab) {
            const msg = chrome.i18n.getMessage('optionsErrorBrowserCannotCreateTab');
            this.emit('error', new Error(msg));
            return;
        }

        this._port = await this.connectToTab(this._maxTabConnectionRetries);
        if (!this._port) {
            if (activeTab && this._tab.id !== activeTab.id) {
                await activateTab(activeTab);
            }

            const msg = chrome.i18n.getMessage('optionsErrorBrowserCannotConnectToTab');
            this.emit('error', new Error(msg));

            return;
        }

        this._port.onDisconnect.addListener(() => this.portDisconnected());
        this._port.onMessage.addListener((msg) => this.portMessage(msg));

        if (activeTab && this._tab.id !== activeTab.id) {
            await activateTab(activeTab);
        }

        this.emit('connected');
    }

    disconnect(): Promise<void> {
        return new Promise((resolve) => {
            this._tab = undefined;
            this._port?.disconnect();
            if (this._port) {
                this._port = undefined;
                this.emit('disconnected');
            }
            resolve();
        });
    }

    request(message: KeeWebConnectRequest): void {
        if (!this._port) {
            this.emit('error', new Error('Port not connected'));
            return;
        }
        this._port.postMessage(message);
    }

    private checkPermissions(): Promise<boolean> {
        return new Promise((resolve) => {
            chrome.permissions.contains(
                {
                    permissions: ['tabs'],
                    origins: [this._keeWebUrl]
                },
                resolve
            );
        });
    }

    private findOrCreateTab(): Promise<chrome.tabs.Tab> {
        return new Promise((resolve) => {
            chrome.tabs.query({ url: this._keeWebUrl }, ([tab]) => {
                if (tab) {
                    resolve(tab);
                } else {
                    chrome.tabs.create({ url: this._keeWebUrl, active: true }, (tab) => {
                        resolve(tab);
                    });
                }
            });
        });
    }

    private portDisconnected(): void {
        if (this._port) {
            this._port = undefined;
            this.emit('disconnected');
        }
        this._tab = undefined;
    }

    private connectToTab(retriesLeft: number): Promise<chrome.runtime.Port> {
        return new Promise((resolve) => {
            if (retriesLeft <= 0) {
                return resolve(undefined);
            }

            const name = TransportBrowserTab.getRandomPortName();
            const port = chrome.tabs.connect(this._tab.id, { name });

            const cleanup = () => {
                clearTimeout(responseTimeout);
                port.onDisconnect.removeListener(tabDisconnected);
                port.onMessage.removeListener(tabMessage);
            };

            const responseTimeout = setTimeout(() => {
                cleanup();
                port.disconnect();
                this.connectToTab(retriesLeft - 1).then(resolve);
            }, this._tabConnectionTimeoutMillis);

            const tabDisconnected = () => {
                cleanup();
                setTimeout(() => {
                    this.connectToTab(retriesLeft - 1).then(resolve);
                }, this._tabConnectionRetryMillis);
            };

            const tabMessage = (msg: KeeWebConnectPingResponse) => {
                cleanup();
                if (msg.data === name) {
                    resolve(port);
                } else {
                    port.disconnect();
                    resolve(undefined);
                }
            };

            port.onDisconnect.addListener(tabDisconnected);
            port.onMessage.addListener(tabMessage);

            const pingRequest: KeeWebConnectPingRequest = {
                kwConnect: 'request',
                action: 'ping',
                data: port.name
            };
            port.postMessage(pingRequest);
        });
    }

    private static getRandomPortName(): string {
        const randomBytes = crypto.getRandomValues(new Uint8Array(32));
        const randomString = btoa(String.fromCharCode(...randomBytes));
        return `keeweb-connect-${randomString}`;
    }

    private portMessage(msg: KeeWebConnectMessage) {
        this.emit('response', msg);
    }
}

export { TransportBrowserTab };
