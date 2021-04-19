export interface BackgroundMessageFromPageConnectToKeeWeb {
    action: 'connect-to-keeweb';
    activeTabId: number;
}

export interface BackgroundMessageFromPageOpenTab {
    action: 'open-tab';
    url: string;
}

export type BackgroundMessageFromPage =
    | BackgroundMessageFromPageConnectToKeeWeb
    | BackgroundMessageFromPageOpenTab;
