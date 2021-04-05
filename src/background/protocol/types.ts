// generic request types

export interface KeeWebConnectRequest {
    action: string;
}

export interface KeeWebConnectEncryptedRequest extends KeeWebConnectRequest {
    message: string;
    nonce: string;
    clientID: string;
}

// generic response types

export interface KeeWebConnectResponse {
    action?: string;
    success?: string;
    error?: string;
    errorCode?: string;
    version?: string;
}

export interface KeeWebConnectEncryptedResponse extends KeeWebConnectResponse {
    message: string;
    nonce: string;
}

// ping

export interface KeeWebConnectPingRequest extends KeeWebConnectRequest {
    action: 'ping';
    data: string;
}

export interface KeeWebConnectPingResponse extends KeeWebConnectResponse {
    data: string;
}

// change-public-keys

export interface KeeWebConnectChangePublicKeysRequest extends KeeWebConnectRequest {
    action: 'change-public-keys';
    publicKey: string;
    nonce: string;
    clientID: string;
}

export interface KeeWebConnectChangePublicKeysResponse extends KeeWebConnectResponse {
    action: 'change-public-keys';
    publicKey: string;
    nonce: string;
}

// get-databasehash

export interface KeeWebConnectGetDatabaseHashRequestPayload extends KeeWebConnectRequest {
    action: 'get-databasehash';
}

export interface KeeWebConnectGetDatabaseHashResponsePayload extends KeeWebConnectResponse {
    action: 'hash';
    hash: string;
}
