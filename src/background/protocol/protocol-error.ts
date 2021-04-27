export class ProtocolError extends Error {
    readonly code: string;

    constructor(message: string, code: string) {
        super(message);
        this.code = code;
    }
}

export enum ProtocolErrorCode {
    DatabaseNotOpened = '1',
    UserRejected = '6',
    NoMatches = '15'
}
