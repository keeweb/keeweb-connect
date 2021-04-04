function getActiveTab(): Promise<chrome.tabs.Tab> {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true }, ([activeTab]) => resolve(activeTab));
    });
}

export { getActiveTab };
