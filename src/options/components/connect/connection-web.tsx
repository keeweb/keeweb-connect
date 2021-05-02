import { FunctionComponent, JSX } from 'preact';
import { res } from 'options/utils';
import { model } from 'options/settings-model';
import { useState } from 'preact/hooks';
import { noop } from 'common/utils';

const ConnectionWeb: FunctionComponent = () => {
    const askKeeWebTabPermission = () => {
        model.askKeeWebTabPermission().catch(noop);
    };

    const [inputKeeWebUrl, setInputKeeWebUrl] = useState('');
    const [inputKeeWebUrlError, setInputKeeWebUrlError] = useState('');

    const keeWebUrlChanged = ({ currentTarget }: JSX.TargetedEvent<HTMLInputElement, Event>) => {
        setInputKeeWebUrlError('');
        setInputKeeWebUrl(currentTarget.value);
    };

    const changeKeeWebUrl = (e: Event) => {
        e.preventDefault();
        try {
            const url = new URL(inputKeeWebUrl);
            if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
                return setInputKeeWebUrlError(res('optionsWebConnectionKeeWebUrlNotHttps'));
            }
            setInputKeeWebUrl('');
            model.setKeeWebUrl(url.toString());
        } catch (e) {
            setInputKeeWebUrlError(`${res('optionsWebConnectionKeeWebUrlInvalid')}: ${e.message}`);
        }
    };

    const cancelChangeKeeWebUrl = (e: Event) => {
        e.preventDefault();
        setInputKeeWebUrl('');
    };

    const resetKeeWebUrl = (e: Event) => {
        e.preventDefault();
        setInputKeeWebUrl('');
        model.setKeeWebUrl(undefined);
    };

    return (
        <>
            <p>{res('optionsWebConnectionKeeWebUrl')}</p>
            <div>
                <form onSubmit={changeKeeWebUrl}>
                    <input
                        type="text"
                        value={inputKeeWebUrl || (model.keeWebUrlIsSet ? model.keeWebUrl : '')}
                        placeholder={model.defaultKeeWebUrl}
                        onInput={keeWebUrlChanged}
                    />
                    {inputKeeWebUrl && inputKeeWebUrl !== model.keeWebUrl ? (
                        <>
                            <button type="submit">
                                {res('optionsWebConnectionChangeKeeWebUrl')}
                            </button>
                            <button class="secondary" onClick={cancelChangeKeeWebUrl}>
                                {res('optionsCancel')}
                            </button>
                        </>
                    ) : model.keeWebUrlIsSet ? (
                        <button onClick={resetKeeWebUrl} class="secondary">
                            {res('optionsWebConnectionResetKeeWebUrl', 'app.keeweb.info')}
                        </button>
                    ) : null}
                </form>
            </div>
            <div class="error top-padding-small">{inputKeeWebUrlError}</div>
            {model.canAccessKeeWebTab === false ? (
                <>
                    <p>{res('optionsWebConnectionTabPermission')}</p>
                    <div>
                        <button onClick={askKeeWebTabPermission}>
                            {res('optionsWebConnectionTabPermissionButton')}
                        </button>
                    </div>
                    <p />
                </>
            ) : null}
        </>
    );
};

export { ConnectionWeb };
