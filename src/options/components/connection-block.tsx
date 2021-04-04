import { FunctionComponent } from 'preact';
import { res } from 'options/utils';
import { model } from 'options/settings-model';
import { ConnectionWeb } from './connect/connection-web';
import { ConnectMode } from './connect/connect-mode';
import { ConnectState } from './connect/connect-state';

const ConnectionBlock: FunctionComponent = () => {
    return (
        <>
            <h2 id="connection">{res('optionsConnection')}</h2>
            <ConnectMode />
            {model.useWebApp ? <ConnectionWeb /> : null}
            <ConnectState />
        </>
    );
};

export { ConnectionBlock };
