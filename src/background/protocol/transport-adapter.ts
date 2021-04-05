import { KeeWebConnectRequest, KeeWebConnectResponse } from './types';

declare interface TransportAdapter {
    request(request: KeeWebConnectRequest): Promise<KeeWebConnectResponse>;
}

export { TransportAdapter };
