# KeeWeb Connect protocol

The protocol is designed to be backward-compatible with [keepassxc-protocol](https://github.com/keepassxreboot/keepassxc-browser/blob/develop/keepassxc-protocol.md).

This way KeeWeb can connect to both KeePassXC-browser and KeeWeb.
Integration with KeeWeb Connect is more native to KeeWeb
because it works well with several databases open at the same time.

However, KeeWeb Connect extension will work only with KeeWeb
because it's relying on our additions.


## Overall differences

Extensions cannot save database ID safely. This means that KeeWeb will present a question
every time an extension is trying to connect.

This way you connect to KeeWeb instead of a particular database, 
and the user can choose what exactly to share when it comes to sharing credentials.

## List of modifications

### `ping`

This message is to verify that the connection is alive without running any logic.

Request:
```json
{
    "action": "ping",
    "data": "<random string>"
}
```

Response:
```json
{
    "data": "<the same random string>"
}
```

### `change-public-keys`

To be able to identify the app and extension, response and request are extended with additional fields:

Request:
```diff
{
    "action": "change-public-keys",
+    "extensionName": "KeeWeb Connect",
+    "version": "1.0",
    "publicKey": "<client public key>",
    "nonce": "34e5d6t7gy8jok",
    "clientID": "<clientID>"
}
```

Response:
```diff
{
    "action": "change-public-keys",
+    "appName": "KeeWeb",
    "version": "1.2.3",
    "publicKey": "<host public key>",
    "success": "true"
}
```

### `get-databasehash`

`hash` is always set to `sha256('KeeWeb')`.

### `associate`

This is a no-op, it won't store anything in the file.
It will always return `KeeWeb` as a database ID and the same hash.

### `test-associate`

Always returns success assuming the client is authenticated and there's an open file.

### `generate-password`

Same contract, but passwords will be generated even if there's no open database.

### `get-totp-by-url`

Returns TOTP by url, similar to `get-logins`.

Unencrypted message:
```json
{
    "action": "get-totp-by-url",
    "url": "<url>",
    "title": "<page-title>"
}
```

Decrypted response:
```json
{
    "totp": "<TOTP>",
    "version": "1.2.3",
    "success": "true"
}
```

### `get-any-field`

Allows user to select a field, similar to `get-logins`.

Unencrypted message:
```json
{
    "action": "get-any-field",
    "url": "<url>",
    "title": "<page-title>"
}
```

Decrypted response:
```json
{
    "field": "<field-name>",
    "value": "<field-value>",
    "version": "1.2.3",
    "success": "true"
}
```

### `attention-required`

Event emitted by KeeWeb when its own tab needs user attention, for example, to approve a connection request.
The extension must focus the tab with KeeWeb when it receives this event, because a browser tab cannot focus itself.
Desktop apps never send this event.

```json
{
    "action": "attention-required"
}
```
