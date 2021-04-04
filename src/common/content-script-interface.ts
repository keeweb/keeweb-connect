interface AutoFillArg {
    text?: string;
    password?: string;
    submit: boolean;
}

interface ContentScriptMessage {
    url: string;
    autoFill?: AutoFillArg;
    getNextAutoFillCommand?: boolean;
}

export { ContentScriptMessage, AutoFillArg };
