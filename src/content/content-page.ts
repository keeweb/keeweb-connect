import {
    ContentScriptMessage,
    AutoFillArg,
    ContentScriptReturn
} from 'common/content-script-interface';

declare global {
    interface Window {
        kwExtensionInstalled: boolean;
    }
}

if (!window.kwExtensionInstalled) {
    window.kwExtensionInstalled = true;

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (sender.id !== chrome.runtime.id) {
            return;
        }

        const response = run(message);
        sendResponse(response);

        function run(message: ContentScriptMessage): ContentScriptReturn {
            if (location.href !== message.url) {
                return;
            }
            if (message.autoFill) {
                autoFill(message.autoFill);
            } else if (message.getNextAutoFillCommand) {
                return getNextAutoFillCommand();
            }
        }

        function getNextAutoFillCommand() {
            const input = <HTMLInputElement>document.activeElement;
            if (input?.tagName !== 'INPUT') {
                return;
            }

            let nextCommand;
            if (input.type === 'password') {
                nextCommand = 'submit-password';
            } else {
                const passInput = getNextFormPasswordInput(input);
                if (passInput) {
                    nextCommand = 'submit-username-password';
                } else {
                    nextCommand = 'submit-username';
                }
            }
            return { nextCommand };
        }

        function autoFill(arg: AutoFillArg) {
            const { text, password, submit } = arg;

            let input = <HTMLInputElement>document.activeElement;
            if (!input) {
                return;
            }

            if (!text) {
                return;
            }

            setInputText(input, text);

            const form = input.form;
            if (!form) {
                return;
            }

            if (password) {
                input = getNextFormPasswordInput(input);
                if (!input) {
                    return;
                }

                input.focus();
                setInputText(input, password);
            }

            if (submit) {
                form.requestSubmit();
            }
        }

        function setInputText(input: HTMLInputElement, text: string) {
            input.value = text;
            input.dispatchEvent(
                new InputEvent('input', { inputType: 'insertFromPaste', data: text })
            );
        }

        function getNextFormPasswordInput(input: HTMLInputElement): HTMLInputElement {
            if (!input.form) {
                return undefined;
            }
            let found = false;
            for (const element of input.form.elements) {
                if (found) {
                    if (element.tagName === 'INPUT') {
                        const inputEl = element as HTMLInputElement;
                        if (inputEl.type === 'password') {
                            return inputEl;
                        }
                    }
                }
                if (element === input) {
                    found = true;
                }
            }
            return undefined;
        }
    });
}

export {};
