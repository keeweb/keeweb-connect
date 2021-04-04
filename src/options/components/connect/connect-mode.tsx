import { FunctionComponent } from 'preact';
import { res } from 'options/utils';
import { model } from 'options/settings-model';

const ConnectMode: FunctionComponent = () => {
    const setUseNativeApp = (useNativeApp: boolean) => {
        model.useNativeApp = useNativeApp;
    };

    return (
        <>
            <p>{res('optionsConnectionMode')}:</p>
            <ul>
                <li>
                    <label>
                        <input
                            type="radio"
                            name="radio-connection-mode"
                            value="app"
                            checked={model.useNativeApp}
                            onChange={() => setUseNativeApp(true)}
                        />{' '}
                        {res('optionsConnectionModeApp')}
                        {': '}
                        <a
                            href="https://github.com/keeweb/keeweb/releases/latest"
                            target="_blank"
                            rel="noreferrer"
                        >
                            {res('optionsConnectionModeAppDownloadLink')}
                        </a>
                        .
                    </label>
                </li>
                <li>
                    <label>
                        <input
                            type="radio"
                            name="radio-connection-mode"
                            value="web"
                            checked={model.useWebApp}
                            onChange={() => setUseNativeApp(false)}
                        />{' '}
                        {res('optionsConnectionModeWeb')}
                        {': '}
                        <a href={model.keeWebUrl} target="_blank" rel="noreferrer">
                            {res('optionsConnectionModeWebLink')}
                        </a>
                        .
                    </label>
                </li>
            </ul>
        </>
    );
};

export { ConnectMode };
