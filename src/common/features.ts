const isSafari = location.origin.startsWith('safari');
const isFirefox = location.origin.startsWith('moz');

export const supportsUnicodeMenus = !isSafari;
export const canUseOnlyAppConnection = isSafari;
export const canEditShortcuts = !isSafari;
export const shortcutsCanBeEditedOnlyManually = isFirefox;
export const needRequestPermissionsPerSite = isSafari;
