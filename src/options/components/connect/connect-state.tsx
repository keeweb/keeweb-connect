import { FunctionComponent } from 'preact';
import { res } from 'options/utils';
import { model } from 'options/settings-model';
import { BackendConnectionState } from 'common/backend-connection-state';

const ConnectState: FunctionComponent = () => {
    const state = model.backendConnectionState;

    const connectToKeeWeb = () => {
        model.connectToKeeWeb();
    };

    return (
        <>
            {model.canUseOnlyApp ? (
                <p>
                    {res('optionsConnectionModeAppOnly')}{' '}
                    <a
                        href="https://github.com/keeweb/keeweb/releases/latest"
                        target="_blank"
                        rel="noreferrer"
                    >
                        {res('optionsConnectionModeAppDownloadLink')}
                    </a>
                </p>
            ) : null}
            <p>
                {res('optionsConnectionState')}{' '}
                {state === BackendConnectionState.Error ? (
                    <span class="error">{res('optionsConnectionStateError')}</span>
                ) : null}
                {state === BackendConnectionState.ReadyToConnect ? (
                    <span>{res('optionsConnectionStateReadyToConnect')}</span>
                ) : null}
                {state === BackendConnectionState.Connecting ? (
                    <span>{res('optionsConnectionStateConnecting')}&hellip;</span>
                ) : null}
                {state === BackendConnectionState.Connected ? (
                    <span class="success">{res('optionsConnectionStateConnected')}</span>
                ) : null}
            </p>
            {state === BackendConnectionState.ReadyToConnect ||
            state === BackendConnectionState.Error ? (
                <div>
                    {model.backendConnectionError ? (
                        <p class="error">{model.backendConnectionError}</p>
                    ) : null}
                    <button onClick={connectToKeeWeb}>{res('optionsConnectButton')}</button>
                </div>
            ) : null}
        </>
    );
};

export { ConnectState };
