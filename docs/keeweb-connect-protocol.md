# KeeWeb Connect protocol

The protocol is designed to be backward-compatible with [keepassxc-protocol](https://github.com/keepassxreboot/keepassxc-browser/blob/develop/keepassxc-protocol.md).

This way KeeWeb can connect to both KeePassXC-browser and KeeWeb.
Integration with KeeWeb Connect is more native to KeeWeb
because it works well with several databases open at the same time.

However, KeeWeb Connect extension will work only with KeeWeb
because it's relying on our additions.

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
+    "extensionName": "keeweb-connect",
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

`hash` is set to the ID of the first open database for backward compatibility.

Response is extended with `hashes` property to accommodate multiple databases:
```diff
{
    "action": "hash",
    "hash": "h7g86f67fygu",
+    "hashes": ["w112wewe21w123", "12w2e1212e1e"],
    "version": "1.2.3"
}
```

### `lock-database`

Same messages, however it will lock all open databases.

### `attention-required`

Event emitted by the KeeWeb when its own tab needs user attention, for example, to approve a connection request.
The extension must focus the tab with KeeWeb when it receives this event, because a browser tab cannot focus itself.

```json
{
    "action": "attention-required"
}
```
