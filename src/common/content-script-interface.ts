export interface ContentScriptMessageAutoFill {
    action: 'auto-fill';
    url: string;
    text?: string;
    password?: string;
    submit: boolean;
}

export interface ContentScriptMessageGetNextAutoFillCommand {
    action: 'get-next-auto-fill-command';
    url: string;
}

export type ContentScriptMessage =
    | ContentScriptMessageAutoFill
    | ContentScriptMessageGetNextAutoFillCommand;

export interface ContentScriptReturn {
    nextCommand?: string;
}
