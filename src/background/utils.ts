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

export { getActiveTab, activateTab };
