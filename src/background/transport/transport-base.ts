import { EventEmitter } from 'events';
import { KeeWebConnectMessage, KeeWebConnectRequest } from 'common/keeweb-connect-protocol';

declare interface TransportBase {
    on(event: 'connected', listener: () => void): this;
    on(event: 'disconnected', listener: () => void): this;
    on(event: 'error', listener: (e: Error) => void): this;
    on(event: 'response', listener: (message: KeeWebConnectMessage) => void): this;
}

abstract class TransportBase extends EventEmitter {
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract request(message: KeeWebConnectRequest): void;
}

export { TransportBase };
