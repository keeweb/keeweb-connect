import { EventEmitter } from 'events';
import { KeeWebConnectRequest, KeeWebConnectResponse } from 'background/protocol/types';

declare interface TransportBase {
    on(event: 'err', listener: (e: Error) => void): this;
    on(event: 'message', listener: (msg: KeeWebConnectResponse) => void): this;
}

abstract class TransportBase extends EventEmitter {
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract request(message: KeeWebConnectRequest): void;
}

export { TransportBase };
