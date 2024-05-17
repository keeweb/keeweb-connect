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
    const manifestFirefox = require('../manifest.firefox.json');
    const addonUUID = manifestFirefox.browser_specific_settings.gecko.id;
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
        const uploadUUID = resData.uuid;

        // Poll the upload detail endpoint until we are validated
        // https://mozilla.github.io/addons-server/topics/api/addons.html#upload-detail
        var validationRes;
        var validationData;
        var validationTries = 0;
        const validationReq = new Request(`https://addons.mozilla.org/api/v5/addons/upload/${uploadUUID}/`, {
            method: 'GET'
        })
        validationReq.headers.append('Authorization', `JWT ${token}`);
        validationReq.headers.append('Accept', 'application/json');

        while (validationTries < 3 && !validationData?.valid) {
            // Increasingly wait before checking the validation status
            await new Promise(resolve => setTimeout(resolve, 60_000 * (validationTries + 1)));

            validationTries += 1;
            var validationRes = await fetch(validationReq);
            validationData = await validationRes.json();

            console.log('validationData', validationData);
            console.log('validationData.validation.messages', validationData.validation?.messages);
        }

        if (!validationData?.valid)
            throw new Error('Extension did not validate in time.');

        // Send POST to add-on version create endpoint
        // https://mozilla.github.io/addons-server/topics/api/addons.html#version-create
        const addonVersionCreateURL = `https://addons.mozilla.org/api/v5/addons/addon/${addonUUID}/versions/`;
        const addonVersionCreatePayload = {
            license: 'MIT',
            upload: uploadUUID
        }
        const addonVersionCreateReq = new Request(addonVersionCreateURL, {
            method: 'POST',
            body: addonVersionCreatePayload,
        })
        addonVersionCreateReq.headers.append('Authorization', `JWT ${token}`);
        addonVersionCreateReq.headers.append('Accept', 'application/json');
        fetch(addonVersionCreateReq).then(async (res) => {
            if (!res.ok)
                throw new Error(`HTTP error! status: ${res.status}, body: `, resData);

            console.log('response.status:', res.status);
            console.log('response.body:', resData);
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
