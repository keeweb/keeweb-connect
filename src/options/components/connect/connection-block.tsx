import { FunctionComponent } from 'preact';
import { res } from 'options/utils';
import { model } from 'options/settings-model';
import { ConnectionWeb } from './connection-web';
import { ConnectMode } from './connect-mode';
import { ConnectState } from './connect-state';
import { canUseOnlyAppConnection } from 'common/features';

const ConnectionBlock: FunctionComponent = () => {
    return (
        <>
            <h2 id="connection">{res('optionsConnection')}</h2>
            {canUseOnlyAppConnection ? null : <ConnectMode />}
            {model.useWebApp ? <ConnectionWeb /> : null}
            <ConnectState />
        </>
    );
};

export { ConnectionBlock };
