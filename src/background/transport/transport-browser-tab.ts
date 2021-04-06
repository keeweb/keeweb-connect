import { TransportBase } from './transport-base';
import { activateTab, getActiveTab, randomBase64 } from 'background/utils';
import {
    KeeWebConnectRequest,
    KeeWebConnectResponse,
    KeeWebConnectPingRequest,
    KeeWebConnectPingResponse
} from 'background/protocol/types';
import { noop } from 'common/utils';

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
            const msg = chrome.i18n.getMessage('errorBrowserTabNoPermissions', this._keeWebUrl);
            throw new Error(msg);
        }

        const activeTab = await getActiveTab();
        this._tab = await this.findOrCreateTab();
        if (!this._tab) {
            throw new Error(chrome.i18n.getMessage('errorBrowserCannotCreateTab'));
        }

        this._port = await this.connectToTab(this._maxTabConnectionRetries);
        if (!this._port) {
            if (activeTab && this._tab.id !== activeTab.id) {
                await activateTab(activeTab);
            }
            throw new Error(chrome.i18n.getMessage('errorBrowserCannotConnectToTab'));
        }

        this._port.onDisconnect.addListener(() => this.portDisconnected());
        this._port.onMessage.addListener((msg) => this.portMessage(msg));

        if (activeTab && this._tab.id !== activeTab.id) {
            await activateTab(activeTab);
        }
    }

    disconnect(): Promise<void> {
        return new Promise((resolve) => {
            this._tab = undefined;
            this._port?.disconnect();
            if (this._port) {
                this.portDisconnected();
            }
            resolve();
        });
    }

    request(message: KeeWebConnectRequest): void {
        if (this._port) {
            this._port.postMessage(message);
        }
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

    private portDisconnected() {
        this._tab = undefined;
        if (this._port) {
            this._port = undefined;
            this.emit('disconnected');
        }
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
                this.connectToTab(retriesLeft - 1)
                    .then(resolve)
                    .catch(noop);
            }, this._tabConnectionTimeoutMillis);

            const tabDisconnected = () => {
                if (chrome.runtime.lastError) {
                    // eslint-disable-next-line no-console
                    console.warn(
                        'KeeWeb tab disconnected with error',
                        chrome.runtime.lastError.message
                    );
                }
                cleanup();
                setTimeout(() => {
                    this.connectToTab(retriesLeft - 1)
                        .then(resolve)
                        .catch(noop);
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
                action: 'ping',
                data: port.name
            };
            port.postMessage(pingRequest);
        });
    }

    private static getRandomPortName(): string {
        return `keeweb-connect-${randomBase64(32)}`;
    }

    private portMessage(msg: KeeWebConnectResponse) {
        this.emit('message', msg);
    }
}

export { TransportBrowserTab };
