import { FunctionComponent } from 'preact';
import { res } from 'options/utils';
import { model } from 'options/settings-model';

const Shortcuts: FunctionComponent = () => {
    const openShortcuts = (e: Event) => {
        e.preventDefault();
        chrome.tabs.create({ url: 'chrome://extensions/shortcuts', active: true });
    };

    return (
        <>
            <h2 id="shortcuts">{res('optionsShortcuts')}</h2>
            <p>{res('optionsShortcutsDescription')}</p>
            <ul>
                {model.shortcuts.map((command) => (
                    <li key={command.name}>
                        {command.description}: {command.shortcut}
                    </li>
                ))}
            </ul>
            <p>
                <a target="_blank" rel="noreferrer" onClick={openShortcuts}>
                    {res('optionsShortcutsLink')}
                </a>
            </p>
        </>
    );
};

export { Shortcuts };
