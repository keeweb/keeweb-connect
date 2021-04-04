import { EventEmitter } from 'events';
import { BackendConnectionState } from 'common/backend-connection-state';
import { TransportBase } from './transport/transport-base';
import { TransportNativeMessaging } from './transport/transport-native-messaging';
import { TransportBrowserTab } from './transport/transport-browser-tab';

interface KeeWebConnectionKey {
    name: string;
    dbHash: string;
    idKey: string;
    created: number;
}

class Backend extends EventEmitter {
    private readonly _defaultKeeWebUrl = 'https://app.keeweb.info/';

    private _state: BackendConnectionState;
    private _connectionError: string;
    private _transport: TransportBase;
    private _keys: KeeWebConnectionKey[] = [];

    private _useNativeApp = true;
    private _keeWebUrl: string;

    get state(): BackendConnectionState {
        return this._state;
    }
    private setState(state: BackendConnectionState): void {
        if (this._state !== state) {
            this._state = state;
            this.emit('state-changed');
        }
    }

    get connectionError(): string {
        return this._connectionError;
    }

    init(): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.onChanged.addListener((changes) => this.storageChanged(changes));
            chrome.storage.local.get(['useNativeApp', 'keeWebUrl', 'keys'], (storageData) => {
                this._useNativeApp = storageData.useNativeApp ?? true;
                this._keeWebUrl = storageData.keeWebUrl;
                this._keys = storageData.keys ?? [];
                this.resetStateByConfig();
                resolve();
            });
        });
    }

    private async storageChanged(changes: { [prop: string]: chrome.storage.StorageChange }) {
        if (changes.useNativeApp) {
            this._useNativeApp = changes.useNativeApp.newValue;
        } else if (changes.keeWebUrl) {
            this._keeWebUrl = changes.keeWebUrl.newValue;
        } else {
            return;
        }

        if (this._transport) {
            this._transport.removeAllListeners();
            await this._transport.disconnect();
            this._transport = undefined;
        }
        this.resetStateByConfig();
    }

    async connect(): Promise<void> {
        if (
            this.state === BackendConnectionState.Connected ||
            this.state === BackendConnectionState.Connecting
        ) {
            return Promise.resolve();
        }
        this._connectionError = undefined;
        this.setState(BackendConnectionState.Connecting);
        this.initTransport();
        await this._transport.connect();
    }

    private resetStateByConfig(): void {
        this._connectionError = undefined;
        if (this._keys.length) {
            this.setState(BackendConnectionState.ReadyToConnect);
        } else {
            this.setState(BackendConnectionState.NotConfigured);
        }
    }

    private initTransport(): void {
        if (this._useNativeApp) {
            this._transport = new TransportNativeMessaging();
        } else {
            this._transport = new TransportBrowserTab(this._keeWebUrl || this._defaultKeeWebUrl);
        }
        this._transport.on('connected', () => {
            this._connectionError = undefined;
            this.setState(BackendConnectionState.Connected);
        });
        this._transport.on('disconnected', () => {
            if (this.state === BackendConnectionState.Connected) {
                this.resetStateByConfig();
            } else {
                this._connectionError ??= chrome.i18n.getMessage('optionsErrorKeeWebDisconnected');
                this.setState(BackendConnectionState.Error);
            }
        });
        this._transport.on('error', (e) => {
            this._connectionError = e?.message;
            this.setState(BackendConnectionState.Error);
        });
    }

    getFields(url: string, fields: string[]): Promise<Map<string, string>> {
        const result = new Map<string, string>();
        if (fields.includes('Password')) {
            result.set('Password', 'p@ssw0rd');
        }
        if (fields.includes('Password')) {
            result.set('UserName', 'user');
        }
        return Promise.resolve(result);
    }
}

const backend = new Backend();

export { backend };
