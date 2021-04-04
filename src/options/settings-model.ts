import { EventEmitter } from 'events';
import { OptionsPageMessage } from 'common/options-page-interface';
import { BackendConnectionState } from 'common/backend-connection-state';
import { BackgroundMessageFromPage } from 'common/background-interface';

class SettingsModel extends EventEmitter {
    readonly defaultKeeWebUrl = 'https://app.keeweb.info/';

    private _loaded = false;
    private _canAccessKeeWebTab: boolean;
    private _keeWebUrl: string;
    private _useNativeApp: boolean;
    private _backgroundPagePort: chrome.runtime.Port;
    private _chromeCommands: chrome.commands.Command[];
    private _backendConnectionState: BackendConnectionState;
    private _backendConnectionError: string;

    async init() {
        await this.loadStorageConfig();
        await this.checkPermissions();
        await this.connectToBackgroundPage();
        await this.getShortcuts();
        this.initComplete();
    }

    private loadStorageConfig(): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.local.get(['useNativeApp', 'keeWebUrl'], (result) => {
                this._useNativeApp = result.useNativeApp ?? true;
                this._keeWebUrl = result.keeWebUrl;
                resolve();
            });
        });
    }

    private checkPermissions(): Promise<void> {
        return new Promise((resolve) => {
            chrome.permissions.contains(
                {
                    permissions: ['tabs'],
                    origins: [this.keeWebUrl]
                },
                (canAccessKeeWebTab) => {
                    this._canAccessKeeWebTab = !!canAccessKeeWebTab;
                    resolve();
                }
            );
        });
    }

    private connectToBackgroundPage(): Promise<void> {
        return new Promise((resolve) => {
            this._backgroundPagePort = chrome.runtime.connect({ name: 'options' });
            this._backgroundPagePort.onMessage.addListener((message) =>
                this.handleMessageFromBackgroundPage(message as OptionsPageMessage)
            );
            resolve();
        });
    }

    private getShortcuts(): Promise<void> {
        return new Promise((resolve) => {
            chrome.commands.getAll((commands) => {
                this._chromeCommands = commands;
                resolve();
            });
        });
    }

    private initComplete() {
        this._loaded = true;
        this.emit('change');
    }

    get loaded(): boolean {
        return this._loaded;
    }

    get useNativeApp(): boolean {
        return this._useNativeApp;
    }
    set useNativeApp(useNativeApp: boolean) {
        this._useNativeApp = useNativeApp;
        chrome.storage.local.set({ useNativeApp }, () => this.emit('change'));
    }

    get useWebApp(): boolean {
        return !this._useNativeApp;
    }

    get keeWebUrl(): string {
        return this._keeWebUrl || this.defaultKeeWebUrl;
    }
    set keeWebUrl(keeWebUrl: string) {
        if (keeWebUrl === this.defaultKeeWebUrl) {
            keeWebUrl = undefined;
        }
        this._keeWebUrl = keeWebUrl;
        this._canAccessKeeWebTab = undefined;
        (async () => {
            await new Promise<void>((resolve) => {
                if (keeWebUrl) {
                    chrome.storage.local.set({ keeWebUrl }, () => resolve());
                } else {
                    chrome.storage.local.remove(['keeWebUrl'], () => resolve());
                }
            });
            this.emit('change');
            await this.checkPermissions();
            this.emit('change');
        })();
    }

    get keeWebUrlIsSet(): boolean {
        return !!this._keeWebUrl;
    }

    get canAccessKeeWebTab(): boolean {
        return this._canAccessKeeWebTab;
    }
    askKeeWebTabPermission(): Promise<boolean> {
        return new Promise((resolve) => {
            chrome.permissions.request(
                {
                    permissions: ['tabs'],
                    origins: [this.keeWebUrl]
                },
                (granted) => {
                    if (granted) {
                        this._canAccessKeeWebTab = true;
                        this.emit('change');
                    }
                    resolve(granted);
                }
            );
        });
    }

    get shortcuts(): chrome.commands.Command[] {
        return this._chromeCommands.filter((cmd) => cmd.shortcut);
    }

    private handleMessageFromBackgroundPage(message: OptionsPageMessage) {
        if (message.backendConnectionState) {
            this._backendConnectionState = message.backendConnectionState;
            this._backendConnectionError = message.backendConnectionError;
            this.emit('change');
        }
    }

    get backendConnectionState(): BackendConnectionState {
        return this._backendConnectionState;
    }

    get backendConnectionError(): string {
        return this._backendConnectionError;
    }

    connectToKeeWeb(): void {
        const message: BackgroundMessageFromPage = { connectToKeeWeb: true };
        this._backgroundPagePort.postMessage(message);
    }
}

const model = new SettingsModel();

export { model };
