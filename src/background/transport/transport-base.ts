import { EventEmitter } from 'events';
import { KeeWebConnectRequest, KeeWebConnectResponse } from 'background/protocol/types';

declare interface TransportBase {
    on(event: 'disconnected', listener: () => void): this;
    on(event: 'message', listener: (msg: KeeWebConnectResponse) => void): this;
}

abstract class TransportBase extends EventEmitter {
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract request(message: KeeWebConnectRequest): void;
    abstract focusKeeWeb(): void;
}

export { TransportBase };
