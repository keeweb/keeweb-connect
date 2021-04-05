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
