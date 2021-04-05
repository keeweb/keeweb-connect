export enum ConnectedDatabaseState {
    Closed = 'Closed',
    Open = 'Open'
}

export interface ConnectedDatabase {
    name: string;
    dbHash: string;
    state: ConnectedDatabaseState;
}
