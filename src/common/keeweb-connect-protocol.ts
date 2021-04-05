export interface KeeWebConnectMessage {
    kwConnect: string;
}

export interface KeeWebConnectRequest extends KeeWebConnectMessage {
    kwConnect: 'request';
    action: string;
}

export interface KeeWebConnectResponse extends KeeWebConnectMessage {
    kwConnect: 'response';
    success?: boolean;
    error?: string;
}

export interface KeeWebConnectEvent extends KeeWebConnectMessage {
    kwConnect: 'event';
}

export interface KeeWebConnectPingRequest extends KeeWebConnectRequest {
    action: 'ping';
    data: string;
}

export interface KeeWebConnectPingResponse extends KeeWebConnectResponse {
    data: string;
}
