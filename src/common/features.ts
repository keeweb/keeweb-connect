const isSafari = location.origin.includes('safari');

export const supportsUnicodeMenus = !isSafari;
export const canUseOnlyAppConnection = isSafari;
export const canEditShortcuts = !isSafari;
