import { TypedEmitter } from 'tiny-typed-emitter';
import { KeeWebConnectRequest, KeeWebConnectResponse } from 'background/protocol/types';

interface TransportBaseEvents {
    disconnected: () => void;
    message: (msg: KeeWebConnectResponse) => void;
}

abstract class TransportBase extends TypedEmitter<TransportBaseEvents> {
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract request(message: KeeWebConnectRequest): void;
    abstract focusKeeWeb(): void;
}

export { TransportBase };
