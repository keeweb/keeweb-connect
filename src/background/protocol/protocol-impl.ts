import {
    KeeWebConnectRequest,
    KeeWebConnectResponse,
    KeeWebConnectChangePublicKeysRequest,
    KeeWebConnectChangePublicKeysResponse,
    KeeWebConnectEncryptedResponse,
    KeeWebConnectGetDatabaseHashRequest,
    KeeWebConnectGetDatabaseHashRequestPayload,
    KeeWebConnectGetDatabaseHashResponse,
    KeeWebConnectGetDatabaseHashResponsePayload
} from './types';
import { fromBase64, randomBase64, randomBytes, toBase64 } from 'background/utils';
import { box as tweetnaclBox, BoxKeyPair } from 'tweetnacl';
import { TransportAdapter } from './transport-adapter';

class ProtocolImpl {
    private readonly _keySize = 24;

    private _transport: TransportAdapter;
    private _clientId: string;
    private _ownKeys: BoxKeyPair;
    private _ownNonce: Uint8Array;
    private _keewebPublicKey: Uint8Array;

    constructor(transport: TransportAdapter) {
        this._transport = transport;
        this.generateKeys();
    }

    private generateKeys() {
        this._clientId = randomBase64(this._keySize);
        this._ownKeys = tweetnaclBox.keyPair();
        this._ownNonce = randomBytes(this._keySize);
    }

    private encryptRequestPayload(payload: KeeWebConnectRequest): string {
        const json = JSON.stringify(payload);
        const data = new TextEncoder().encode(json);

        const encrypted = tweetnaclBox(
            data,
            this._ownNonce,
            this._keewebPublicKey,
            this._ownKeys.secretKey
        );
        return toBase64(encrypted);
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
        response: KeeWebConnectEncryptedResponse
    ): KeeWebConnectResponse {
        if (!response.message) {
            return undefined;
        }
        const message = ProtocolImpl.fieldFromBase64(response.message, 'message');
        const nonce = ProtocolImpl.fieldFromBase64(response.nonce, 'nonce');
        const data = tweetnaclBox.open(
            message,
            nonce,
            this._keewebPublicKey,
            this._ownKeys.secretKey
        );

        const json = new TextDecoder().decode(data);
        const payload = JSON.parse(json);

        return ProtocolImpl.checkResponseError(payload);
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
            throw new Error(`${locErr}: ${resErr}`);
        }
        return response;
    }

    async changePublicKeys(): Promise<void> {
        const request: KeeWebConnectChangePublicKeysRequest = {
            action: 'change-public-keys',
            publicKey: toBase64(this._ownKeys.publicKey),
            nonce: toBase64(this._ownNonce),
            clientID: this._clientId
        };
        const response = <KeeWebConnectChangePublicKeysResponse>await this.request(request);
        this._keewebPublicKey = fromBase64(response.publicKey);
    }

    async getDatabaseHash(): Promise<string> {
        const payload: KeeWebConnectGetDatabaseHashRequestPayload = {
            action: 'get-databasehash'
        };
        const request: KeeWebConnectGetDatabaseHashRequest = {
            action: 'get-databasehash',
            message: this.encryptRequestPayload(payload),
            nonce: toBase64(this._ownNonce),
            clientID: this._clientId
        };
        const response = <KeeWebConnectGetDatabaseHashResponse>await this.request(request);
        const responsePayload = <KeeWebConnectGetDatabaseHashResponsePayload>(
            this.decryptResponsePayload(response)
        );
        return responsePayload.hash;
    }
}

export { ProtocolImpl };
