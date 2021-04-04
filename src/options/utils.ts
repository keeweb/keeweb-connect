function res(name: string): string {
    return chrome.i18n.getMessage(name) || name;
}

export { res };
