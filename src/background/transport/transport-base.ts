import { EventEmitter } from 'events';

declare interface TransportBase {
    on(event: 'connected', listener: () => void): this;
    on(event: 'disconnected', listener: () => void): this;
    on(event: 'error', listener: (e: Error) => void): this;
}

abstract class TransportBase extends EventEmitter {
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
}

export { TransportBase };
