export interface AutoFillArg {
    text?: string;
    password?: string;
    submit: boolean;
}

export interface ContentScriptMessage {
    url: string;
    autoFill?: AutoFillArg;
    getNextAutoFillCommand?: boolean;
}
