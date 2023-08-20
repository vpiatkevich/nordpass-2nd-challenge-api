const axios = require('axios');
const { expect } = require('chai');
const { faker } = require('@faker-js/faker');
const jsonschema = require('jsonschema');
const testData = require('../testData.json')
const getUserItemSchema = require('../data/GET.user.items.json');

describe(`GET /user/items - Returns all user items`, function () {
    let response;
    let token;

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
    });

    const limitValuesToTest = [0, 1, 10, 499, 500];

    for (const limit of limitValuesToTest) {
        describe(`200 - Items successfully returned with limit of ${limit}`, function () {
            let response;

            beforeAll(async () => {
                response = await axios.get(`${testData.baseUrl}/user/items`, {
                    headers: {
                        'accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    params: {
                        'limit': limit
                    }
                })
            });

            test(`Status code is 200`, async () => {
                expect(response.status).to.equal(200);
            })

            test(`JSON schema is valid`, async () => {
                const result = jsonschema.validate(response.data, getUserItemSchema);
                expect(result.valid).to.be.true;
            })
        });
    }

    describe(`401 - Bearer token is missing or invalid`, function () {
        let response;

        beforeAll(async () => {
            response = await axios.get(`${testData.baseUrl}/user/items`, {
                headers: {
                    'accept': 'application/json',
                    'Authorization': `Bearer `
                  },
                params: {
                    'limit': 10
                  }
            })
        });

        test(`Status code is 401`, async () => {
            expect(response.status).to.equal(401);
        })

        test(`Error message validation`, async () => {
            expect(response.data[0].error).to.equal(testData.userNotAuthorizedMessage);
        })
    })

    describe(`400 - Invalid request - limit parameter exceedes maximum allowed`, function () {
        let response;

        beforeAll(async () => {
            response = await axios.get(`${testData.baseUrl}/user/items`, {
                headers: {
                    'accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                params: {
                    'limit': 501
                  }
            })
        });

        test(`Status code is 400`, async () => {
            expect(response.status).to.equal(400);
        })
    })
    
    afterAll(async () => {
        await new Promise(resolve => setTimeout(() => resolve(), 500)); // avoid jest open handle error
      });
});
