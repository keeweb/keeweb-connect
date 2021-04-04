import { TransportBase } from './transport-base';

class TransportNativeMessaging extends TransportBase {
    connect(): Promise<void> {
        this.emit('error', new Error('Not implemented'));
        return Promise.resolve();
    }

    disconnect(): Promise<void> {
        this.emit('disconnected');
        return Promise.resolve();
    }
}

export { TransportNativeMessaging };
