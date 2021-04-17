function res(name: string, ...substitutions: string[]): string {
    return chrome.i18n.getMessage(name, substitutions.length ? substitutions : undefined) || name;
}

export { res };
