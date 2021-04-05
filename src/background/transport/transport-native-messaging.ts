import { TransportBase } from './transport-base';
import { KeeWebConnectRequest } from 'common/keeweb-connect-protocol';

class TransportNativeMessaging extends TransportBase {
    connect(): Promise<void> {
        this.emit('error', new Error('Not implemented'));
        return Promise.resolve();
    }

    disconnect(): Promise<void> {
        this.emit('disconnected');
        return Promise.resolve();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    request(message: KeeWebConnectRequest): void {
        this.emit('error', new Error('Not implemented'));
    }
}

export { TransportNativeMessaging };
