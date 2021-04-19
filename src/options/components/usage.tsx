import { FunctionComponent } from 'preact';
import { res } from 'options/utils';
import { canEditShortcuts, needRequestPermissionsPerSite } from 'common/features';
import { model } from 'options/settings-model';

const Usage: FunctionComponent = () => {
    const defaultShortcut = model.shortcuts.find((cmd) => cmd.name === 'submit-auto')?.shortcut;

    return (
        <>
            <h2 id="usage">{res('optionsUsage')}</h2>
            <p>{res('optionsUsageIntro')}</p>
            <p>{res('optionsUsageButton')}</p>
            <img srcset="../img/button.png 2x" alt="button" />
            <p>
                {canEditShortcuts
                    ? res('optionsUsageShortcut')
                    : res('optionsUsageShortcutNoChange', defaultShortcut || '')}
            </p>
            {needRequestPermissionsPerSite ? (
                <>
                    <p>{res('optionsUsagePermissionsPerSite')}</p>
                    <img srcset="../img/permissions.png 2x" alt="button" />
                </>
            ) : null}
            <p>{res('optionsUsageMenu')}</p>
            <img srcset="../img/menu.png 2x" alt="button" />
        </>
    );
};

export { Usage };
