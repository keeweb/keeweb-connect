function getActiveTab(): Promise<chrome.tabs.Tab> {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true }, ([activeTab]) => resolve(activeTab));
    });
}

function activateTab(tab: chrome.tabs.Tab): Promise<boolean> {
    return new Promise((resolve) => {
        chrome.tabs.update(tab.id, { active: true }, () => {
            const success = !chrome.runtime.lastError;
            resolve(success);
        });
    });
}

function openTab(url: string): Promise<chrome.tabs.Tab> {
    return new Promise((resolve) => {
        chrome.tabs.query({ url }, async ([tab]) => {
            if (tab) {
                await activateTab(tab);
                resolve(tab);
            } else {
                chrome.tabs.create({ url, active: true }, (tab) => {
                    resolve(tab);
                });
            }
        });
    });
}

export { getActiveTab, activateTab, openTab };
