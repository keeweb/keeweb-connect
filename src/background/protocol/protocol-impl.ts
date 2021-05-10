import {
    KeeWebConnectRequest,
    KeeWebConnectResponse,
    KeeWebConnectChangePublicKeysRequest,
    KeeWebConnectChangePublicKeysResponse,
    KeeWebConnectEncryptedResponse,
    KeeWebConnectGetDatabaseHashResponsePayload,
    KeeWebConnectEncryptedRequest,
    KeeWebConnectGetDatabaseHashRequestPayload,
    KeeWebConnectLockDatabaseRequestPayload,
    KeeWebConnectGeneratePasswordRequest,
    KeeWebConnectGeneratePasswordResponsePayload,
    KeeWebConnectPingRequest,
    KeeWebConnectPingResponse,
    KeeWebConnectGetLoginsResponseEntry,
    KeeWebConnectGetLoginsRequestPayload,
    KeeWebConnectGetLoginsResponsePayload,
    KeeWebConnectGetTotpByUrlRequestPayload,
    KeeWebConnectGetTotpByUrlResponsePayload,
    KeeWebConnectGetAnyFieldRequestPayload,
    KeeWebConnectGetAnyFieldResponsePayload
} from './types';
import { fromBase64, randomBase64, randomBytes, toBase64 } from 'background/utils';
import { box as tweetnaclBox, BoxKeyPair } from 'tweetnacl';
import { ProtocolError, ProtocolErrorCode } from './protocol-error';

declare interface ProtocolTransportAdapter {
    request(request: KeeWebConnectRequest): Promise<KeeWebConnectResponse>;
}

declare global {
    interface Window {
        logDecryptedPayload: boolean;
    }
}

class ProtocolImpl {
    private readonly _keySize = 24;

    private readonly _clientId: string;
    private _transport: ProtocolTransportAdapter;
    private _keys: BoxKeyPair;
    private _keewebPublicKey: Uint8Array | undefined;
    private _connectedAppName: string | undefined;

    constructor(transport: ProtocolTransportAdapter) {
        this._transport = transport;
        this._clientId = randomBase64(this._keySize);
        this._keys = tweetnaclBox.keyPair();
    }

    private generateNonce(): Uint8Array {
        return randomBytes(this._keySize);
    }

    private makeEncryptedRequest(payload: KeeWebConnectRequest): KeeWebConnectEncryptedRequest {
        if (window.logDecryptedPayload) {
            // eslint-disable-next-line no-console
            console.log('Request payload', payload);
        }

        const json = JSON.stringify(payload);
        const data = new TextEncoder().encode(json);

        const nonce = this.generateNonce();

        if (!this._keewebPublicKey) {
            throw new Error('KeeWeb public key is not set');
        }

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
        request: { nonce: string },
        response: KeeWebConnectEncryptedResponse
    ): KeeWebConnectResponse | undefined {
        if (!response.message) {
            return undefined;
        }

        ProtocolImpl.validateNonce(request.nonce, response.nonce);

        const message = ProtocolImpl.fieldFromBase64(response.message, 'message');
        const nonce = ProtocolImpl.fieldFromBase64(response.nonce, 'nonce');

        if (!this._keewebPublicKey) {
            throw new Error('KeeWeb public key is not set');
        }

        const data = tweetnaclBox.open(message, nonce, this._keewebPublicKey, this._keys.secretKey);

        if (!data) {
            throw new Error('Error decrypting data');
        }

        const json = new TextDecoder().decode(data);
        const payload = <KeeWebConnectEncryptedResponse>JSON.parse(json);

        if (window.logDecryptedPayload) {
            // eslint-disable-next-line no-console
            console.log('Response payload', payload);
        }

        if (!payload) {
            throw new Error('Empty response payload');
        }
        if (payload.nonce !== response.nonce) {
            throw new Error("Response nonce doesn't match");
        }

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
            if (response.keeWebConnectError) {
                const locErr = chrome.i18n.getMessage(response.keeWebConnectError);
                throw new Error(locErr);
            } else {
                const locErr = chrome.i18n.getMessage('errorAppReturnedError');
                if (response.errorCode) {
                    const errCodeStr = `[code=${response.errorCode}] `;
                    const resErr = `${errCodeStr}${response.error}`;
                    throw new ProtocolError(`${locErr}: ${resErr}`, response.errorCode);
                } else {
                    throw new Error(`${locErr}: ${response.error}`);
                }
            }
        }
        return response;
    }

    get connectedAppName(): string | undefined {
        return this._connectedAppName;
    }

    async ping(): Promise<void> {
        const request: KeeWebConnectPingRequest = { action: 'ping', data: randomBase64(10) };
        const response = <KeeWebConnectPingResponse>await this.request(request);
        if (response.data !== request.data) {
            throw new Error('Ping data is different');
        }
    }

    async changePublicKeys(): Promise<void> {
        const request: KeeWebConnectChangePublicKeysRequest = {
            action: 'change-public-keys',
            extensionName: 'KeeWeb Connect',
            version: chrome.runtime.getManifest().version,
            publicKey: toBase64(this._keys.publicKey),
            nonce: toBase64(this.generateNonce()),
            clientID: this._clientId
        };
        const response = <KeeWebConnectChangePublicKeysResponse>await this.request(request);
        this._keewebPublicKey = fromBase64(response.publicKey);
        this._connectedAppName = response.appName;
    }

    async getDatabaseHash(): Promise<string | undefined> {
        const requestPayload: KeeWebConnectGetDatabaseHashRequestPayload = {
            action: 'get-databasehash'
        };
        const request = this.makeEncryptedRequest(requestPayload);

        let response: KeeWebConnectResponse;
        try {
            response = await this.request(request);
        } catch (e) {
            if (e instanceof ProtocolError && e.code === ProtocolErrorCode.DatabaseNotOpened) {
                return undefined;
            }
            throw e;
        }

        const payload = <KeeWebConnectGetDatabaseHashResponsePayload>(
            this.decryptResponsePayload(request, <KeeWebConnectEncryptedResponse>response)
        );
        return payload.hash;
    }

    async generatePassword(): Promise<string> {
        const request: KeeWebConnectGeneratePasswordRequest = {
            action: 'generate-password',
            nonce: toBase64(this.generateNonce()),
            clientID: this._clientId
        };
        const response = await this.request(request);
        const payload = <KeeWebConnectGeneratePasswordResponsePayload>(
            this.decryptResponsePayload(request, <KeeWebConnectEncryptedResponse>response)
        );
        const password = payload.entries?.[0]?.password;
        if (!password) {
            throw new Error('Password was not generated');
        }
        return password;
    }

    async lockDatabase(): Promise<void> {
        const requestPayload: KeeWebConnectLockDatabaseRequestPayload = {
            action: 'lock-database'
        };
        const request = this.makeEncryptedRequest(requestPayload);

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

    async getLogins(url: string): Promise<KeeWebConnectGetLoginsResponseEntry[]> {
        const requestPayload: KeeWebConnectGetLoginsRequestPayload = {
            action: 'get-logins',
            url
        };
        const request = this.makeEncryptedRequest(requestPayload);

        let response: KeeWebConnectEncryptedResponse;
        try {
            response = <KeeWebConnectEncryptedResponse>await this.request(request);
        } catch (e) {
            if (e instanceof ProtocolError && e.code === ProtocolErrorCode.NoMatches) {
                return [];
            }
            throw e;
        }

        const payload = <KeeWebConnectGetLoginsResponsePayload>(
            this.decryptResponsePayload(request, response)
        );

        return payload.entries;
    }

    async getTotp(url: string, title: string): Promise<string> {
        const requestPayload: KeeWebConnectGetTotpByUrlRequestPayload = {
            action: 'get-totp-by-url',
            url,
            title
        };
        const request = this.makeEncryptedRequest(requestPayload);

        const response = <KeeWebConnectEncryptedResponse>await this.request(request);

        const payload = <KeeWebConnectGetTotpByUrlResponsePayload>(
            this.decryptResponsePayload(request, response)
        );

        return payload.totp;
    }

    async getAnyField(url: string, title: string): Promise<string> {
        const requestPayload: KeeWebConnectGetAnyFieldRequestPayload = {
            action: 'get-any-field',
            url,
            title
        };
        const request = this.makeEncryptedRequest(requestPayload);

        const response = <KeeWebConnectEncryptedResponse>await this.request(request);

        const payload = <KeeWebConnectGetAnyFieldResponsePayload>(
            this.decryptResponsePayload(request, response)
        );

        return payload.value;
    }
}

export { ProtocolImpl };
