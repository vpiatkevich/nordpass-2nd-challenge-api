const axios = require('axios');
const { expect } = require('chai');
const { faker } = require('@faker-js/faker');
const jwtDecode = require('jwt-decode');
const testData = require('../testData.json');
const { createHmac } = require('crypto');

describe(`HMAC Authentication and Enhanced Security Measures for API`, function () {
    let response;
    let token;
    let nonce;
    let xSignature;

    beforeAll(async () => {
        response = await axios.post(`${testData.baseUrl}/v1/user/login`, {
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
              },
            data: {
                "username": faker.internet.userName(),
                "password": faker.internet.password()
            }
        })

        token = response.data.token;
        let decodedToken = jwtDecode(token);
        let signatureKey = decodedToken.signature_key;
        nonce = decodedToken.nonce;
        let requestData = 'GET /user/items';
        
        // Construct HMAC signature
        const hmac = createHmac('sha256', signatureKey);
        hmac.update(`${requestData} ${nonce}`);
        xSignature = hmac.digest('hex');
    });

    describe(`Request to GET /user/items with HMAC headers`, function () {
        beforeAll(async () => {
            response = await axios.get(`${testData.baseUrl}/user/items`, {
                headers: {
                    'accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'X-Nonce': nonce,
                    'X-Signature': xSignature
                  },
                params: {
                    'limit': 10
                  }
            })
        });

        test(`Status code is 200`, async () => {
            expect(response.status).to.equal(200);
        })
    })
    
    afterAll(async () => {
        await new Promise(resolve => setTimeout(() => resolve(), 500)); // avoid jest open handle error
      });
});
