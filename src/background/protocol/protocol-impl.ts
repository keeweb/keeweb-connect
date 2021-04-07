import {
    KeeWebConnectRequest,
    KeeWebConnectResponse,
    KeeWebConnectChangePublicKeysRequest,
    KeeWebConnectChangePublicKeysResponse,
    KeeWebConnectEncryptedResponse,
    KeeWebConnectGetDatabaseHashResponsePayload,
    KeeWebConnectEncryptedRequest,
    KeeWebConnectGetDatabaseHashRequestPayload,
    KeeWebConnectLockDatabaseRequestPayload
} from './types';
import { fromBase64, randomBase64, randomBytes, toBase64 } from 'background/utils';
import { box as tweetnaclBox, BoxKeyPair } from 'tweetnacl';
import { ProtocolError, ProtocolErrorCode } from './protocol-error';

declare interface ProtocolTransportAdapter {
    request(request: KeeWebConnectRequest): Promise<KeeWebConnectResponse>;
}

class ProtocolImpl {
    private readonly _keySize = 24;

    private _transport: ProtocolTransportAdapter;
    private _clientId: string;
    private _keys: BoxKeyPair;
    private _keewebPublicKey: Uint8Array;
    private _connectedAppName: string;

    constructor(transport: ProtocolTransportAdapter) {
        this._transport = transport;
        this.generateKeys();
    }

    private generateKeys() {
        this._clientId = randomBase64(this._keySize);
        this._keys = tweetnaclBox.keyPair();
    }

    private generateNonce(): Uint8Array {
        return randomBytes(this._keySize);
    }

    private makeEncryptedRequest(payload: KeeWebConnectRequest): KeeWebConnectEncryptedRequest {
        const json = JSON.stringify(payload);
        const data = new TextEncoder().encode(json);

        const nonce = this.generateNonce();

        const encrypted = tweetnaclBox(data, nonce, this._keewebPublicKey, this._keys.secretKey);

        return {
            action: payload.action,
            message: toBase64(encrypted),
            nonce: toBase64(nonce),
            clientID: this._clientId
        };
    }

    private static fieldFromBase64(base64: string, fieldName: string): Uint8Array {
        if (!base64) {
            throw new Error(`Empty value ${fieldName}: expected base64`);
        }
        try {
            return fromBase64(base64);
        } catch {
            throw new Error(`Bad value ${fieldName}: failed to decode base64`);
        }
    }

    private decryptResponsePayload(
        request: KeeWebConnectEncryptedRequest,
        response: KeeWebConnectEncryptedResponse
    ): KeeWebConnectResponse {
        if (!response.message) {
            return undefined;
        }

        ProtocolImpl.validateNonce(request.nonce, response.nonce);

        const message = ProtocolImpl.fieldFromBase64(response.message, 'message');
        const nonce = ProtocolImpl.fieldFromBase64(response.nonce, 'nonce');

        const data = tweetnaclBox.open(message, nonce, this._keewebPublicKey, this._keys.secretKey);

        const json = new TextDecoder().decode(data);
        const payload = JSON.parse(json);

        return ProtocolImpl.checkResponseError(payload);
    }

    private static validateNonce(nonce: string, incrementedNonce: string) {
        const nonceData = fromBase64(nonce);

        // from libsodium/utils.c, like it is in KeePassXC
        let i = 0;
        let c = 1;
        for (; i < nonceData.length; ++i) {
            c += nonceData[i];
            nonceData[i] = c;
            c >>= 8;
        }

        const expected = toBase64(nonceData);

        if (expected !== incrementedNonce) {
            throw new Error('Bad nonce in response');
        }
    }

    private async request(request: KeeWebConnectRequest): Promise<KeeWebConnectResponse> {
        const response = await this._transport.request(request);
        return ProtocolImpl.checkResponseError(response);
    }

    private static checkResponseError(response: KeeWebConnectResponse): KeeWebConnectResponse {
        if (response.error) {
            const locErr = chrome.i18n.getMessage('errorAppReturnedError');
            const errCodeStr = response.errorCode ? `[code=${response.errorCode}] ` : '';
            const resErr = `${errCodeStr}${response.error}`;
            throw new ProtocolError(`${locErr}: ${resErr}`, response.errorCode);
        }
        return response;
    }

    get connectedAppName(): string {
        return this._connectedAppName;
    }

    async changePublicKeys(): Promise<void> {
        const request: KeeWebConnectChangePublicKeysRequest = {
            action: 'change-public-keys',
            publicKey: toBase64(this._keys.publicKey),
            nonce: toBase64(this.generateNonce()),
            clientID: this._clientId
        };
        const response = <KeeWebConnectChangePublicKeysResponse>await this.request(request);
        this._keewebPublicKey = fromBase64(response.publicKey);
        this._connectedAppName = response.appName;
    }

    async getDatabaseHashes(): Promise<string[]> {
        const request = this.makeEncryptedRequest(<KeeWebConnectGetDatabaseHashRequestPayload>{
            action: 'get-databasehash'
        });

        let response: KeeWebConnectResponse;
        try {
            response = await this.request(request);
        } catch (e) {
            if (e instanceof ProtocolError && e.code === ProtocolErrorCode.DatabaseNotOpened) {
                return [];
            } else {
                throw e;
            }
        }

        const payload = <KeeWebConnectGetDatabaseHashResponsePayload>(
            this.decryptResponsePayload(request, <KeeWebConnectEncryptedResponse>response)
        );
        return payload.hashes || [payload.hash];
    }

    async lockDatabase(): Promise<void> {
        const request = this.makeEncryptedRequest(<KeeWebConnectLockDatabaseRequestPayload>{
            action: 'lock-database'
        });

        try {
            const response = await this.request(request);
            this.decryptResponsePayload(request, <KeeWebConnectEncryptedResponse>response);
        } catch (e) {
            if (e instanceof ProtocolError && e.code === ProtocolErrorCode.DatabaseNotOpened) {
                return;
            }
            throw e;
        }
    }
}

export { ProtocolImpl };
