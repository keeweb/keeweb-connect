var jwt = require('jsonwebtoken');

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

console.log(token);

// process.env.WEB_EXT_JWT = token;

// const https = require('https');

// const options = {
//     hostname: 'addons.mozilla.org',
//     port: 443,
//     path: '/api/v5/addons/upload/',
//     method: 'POST'
// }

// function httpsPost({body, ...options}) {
//     return new Promise((resolve,reject) => {
//         const req = https.request({
//             method: 'POST',
//             ...options,
//         }, res => {
//             const chunks = [];
//             res.on('data', data => chunks.push(data))
//             res.on('end', () => {
//                 let resBody = Buffer.concat(chunks);
//                 switch(res.headers['content-type']) {
//                     case 'application/json':
//                         resBody = JSON.parse(resBody);
//                         break;
//                 }
//                 resolve(resBody)
//             })
//         })
//         req.on('error',reject);
//         if(body) {
//             req.write(body);
//         }
//         req.end();
//     })
// }

// async function main() {
//     const res = await httpsPost({
//         hostname: 'addons.mozilla.org',
//         path: '/api/v5/addons/upload/',
//         headers: {
//             'Authorization': `JWT ${token}`,
//             'Content-Type': 'multipart/form-data',
//         },
//         body: JSON.stringify({
//             channel: listed,
//         })
//     })
// }

// main().catch(err => {
//     console.log(err)
// })
