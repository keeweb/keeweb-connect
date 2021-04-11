export function activateTab(tabId: number): Promise<boolean> {
    return new Promise((resolve) => {
        chrome.tabs.update(tabId, { active: true }, () => {
            const success = !chrome.runtime.lastError;
            resolve(success);
        });
    });
}

export function openTab(url: string): Promise<chrome.tabs.Tab> {
    return new Promise((resolve) => {
        chrome.tabs.query({ url }, async ([tab]) => {
            if (tab) {
                await activateTab(tab.id);
                resolve(tab);
            } else {
                chrome.tabs.create({ url, active: true }, (tab) => {
                    resolve(tab);
                });
            }
        });
    });
}

export function toBase64(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes));
}

export function fromBase64(str: string): Uint8Array {
    return Uint8Array.from(atob(str), (ch) => ch.charCodeAt(0));
}

export function randomBytes(byteLength: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(byteLength));
}

export function randomBase64(byteLength: number): string {
    return toBase64(randomBytes(byteLength));
}
