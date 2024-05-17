/*
 * Publish Firefox addon
 * https://blog.mozilla.org/addons/2022/03/17/new-api-for-submitting-and-updating-add-ons/
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');

var issuedAt = Math.floor(Date.now() / 1000);
var payload = {
  iss: process.env.WEB_EXT_API_KEY,
  jti: Math.random().toString(),
  iat: issuedAt,
  exp: issuedAt + 60,
};

var secret = process.env.WEB_EXT_API_SECRET;  // store this securely.
var token = jwt.sign(payload, secret, {
  algorithm: 'HS256',  // HMAC-SHA256 signing algorithm
});

const https = require('https');

const options = {
    hostname: 'addons.mozilla.org',
    port: 443,
    path: '/api/v5/addons/upload/',
    method: 'POST'
}

async function main() {
    const manifest = require('../manifest.json');
    const fileName = `keeweb_connect-${manifest.version}.zip`
    const filePath = `web-ext-artifacts/${fileName}`
    const fileBuffer = fs.createReadStream(filePath);
    const fileBlob = new Blob([fileBuffer]);

    // Upload the zipped add-on file to the upload create endpoint
    // https://addons-server.readthedocs.io/en/latest/topics/api/addons.html#upload-create
    const form = new FormData();
    form.set('upload', fileBlob, fileName);
    form.set('channel', 'listed');

    const uploadCreateURL = 'https://addons.mozilla.org/api/v5/addons/upload/'
    const req = new Request(uploadCreateURL, {
        method: 'POST',
        body: form,
    })
    req.headers.append('Authorization', `JWT ${token}`);
    req.headers.append('Accept', 'application/json');


    fetch(req).then(async (res) => {
        const resData = await res.json();

        if (!res.ok)
            throw new Error(`HTTP error! status: ${res.status}, body: `, resData);

        console.log('response.status:', res.status);
        console.log('response.body:', resData);
        const uuid = resData.uuid;

        // TODO: send patch to add-ons edit endpoint OR version edit endpoint
        // https://addons-server.readthedocs.io/en/latest/topics/api/addons.html#edit
        // https://mozilla.github.io/addons-server/topics/api/addons.html#version-edit
        const addonPatchURL = `https://addons.mozilla.org/api/v5/addons/addon/${uuid}/`;
        const addonPatchPayload = {
            slug: "new-slug", // what?
            tags: [] // what tags?
        }
        const req = new Request(addonPatchURL, {
            method: 'PATCH',
            body: addonPatchPayload,
        })

        //TODO do we need to submit source code?
    })
    .catch(err => {
        console.error(err);
    });
}

main().catch(err => {
    console.log(err)
})
