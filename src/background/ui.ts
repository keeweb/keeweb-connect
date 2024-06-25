import { runCommand } from './commands';
import { supportsUnicodeMenus } from 'common/features';

export function createUIMenus(): void {
    chrome.contextMenus.onClicked.addListener(async (e, tab) => {
        if (!e.editable || !tab || !e.menuItemId) {
            return;
        }

        const command = e.menuItemId as string;
        if (command === 'settings') {
            void chrome.runtime.openOptionsPage();
            return;
        }

        const url = e.frameId ? e.frameUrl : e.pageUrl;
        const frameId = e.frameId ?? 0;

        await runCommand({ command, tab, url, frameId });
    });

    const submitSuffix = supportsUnicodeMenus ? ' ⏎' : '';
    const ellipsis = supportsUnicodeMenus ? '…' : '...';

    chrome.contextMenus.create(
        {
            id: 'keeweb-options',
            title: 'KeeWeb',
            contexts: ['editable']
        },
        () => {
            chrome.contextMenus.create({
                id: 'submit-username-password',
                parentId: 'keeweb-options',
                title: `${chrome.i18n.getMessage('cmdSubmitUsernamePassword')}${submitSuffix}`,
                contexts: ['editable']
            });
            chrome.contextMenus.create({
                id: 'insert-username-password',
                parentId: 'keeweb-options',
                title: chrome.i18n.getMessage('cmdInsertUsernamePassword'),
                contexts: ['editable']
            });
            chrome.contextMenus.create({
                id: 'submit-username',
                parentId: 'keeweb-options',
                title: `${chrome.i18n.getMessage('cmdSubmitUsername')}${submitSuffix}`,
                contexts: ['editable']
            });
            chrome.contextMenus.create({
                id: 'insert-username',
                parentId: 'keeweb-options',
                title: chrome.i18n.getMessage('cmdInsertUsername'),
                contexts: ['editable']
            });
            chrome.contextMenus.create({
                id: 'submit-password',
                parentId: 'keeweb-options',
                title: `${chrome.i18n.getMessage('cmdSubmitPassword')}${submitSuffix}`,
                contexts: ['editable']
            });
            chrome.contextMenus.create({
                id: 'insert-password',
                parentId: 'keeweb-options',
                title: chrome.i18n.getMessage('cmdInsertPassword'),
                contexts: ['editable']
            });

            chrome.contextMenus.create({
                id: 'sep-bottom',
                type: 'separator',
                parentId: 'keeweb-options',
                contexts: ['editable']
            });

            chrome.contextMenus.create({
                id: 'insert-otp',
                parentId: 'keeweb-options',
                title: chrome.i18n.getMessage('cmdInsertOtp'),
                contexts: ['editable']
            });
            chrome.contextMenus.create({
                id: 'insert-other',
                parentId: 'keeweb-options',
                title: `${chrome.i18n.getMessage('menuOtherOptions')}${ellipsis}`,
                contexts: ['editable']
            });
            chrome.contextMenus.create({
                id: 'settings',
                parentId: 'keeweb-options',
                title: chrome.i18n.getMessage('menuSettings'),
                contexts: ['editable']
            });
        }
    );
}

export function bindExtensionButtonClick(): void {
    chrome.action.onClicked.addListener(async (tab) => {
        await runCommand({ command: 'submit-auto', tab });
    });
}
