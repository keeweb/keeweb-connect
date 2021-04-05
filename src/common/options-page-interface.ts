import { BackendConnectionState } from './backend-connection-state';

export interface OptionsPageMessage {
    backendConnectionState?: BackendConnectionState;
    backendConnectionError?: string;
}
