import { BackendConnectionState } from './backend-connection-state';

interface OptionsPageMessage {
    backendConnectionState?: BackendConnectionState;
    backendConnectionError?: string;
}

export { OptionsPageMessage };
