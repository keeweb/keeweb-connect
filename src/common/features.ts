const isSafari = location.origin.includes('safari');

export const supportsUnicodeMenus = !isSafari;
export const canUseOnlyAppConnection = true;
export const canEditShortcuts = !isSafari;
export const needRequestPermissionsPerSite = isSafari;
