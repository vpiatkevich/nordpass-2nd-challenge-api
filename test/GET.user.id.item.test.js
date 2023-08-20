const axios = require('axios');
const { expect } = require('chai');
const { faker } = require('@faker-js/faker');
const jsonschema = require('jsonschema');
const testData = require('../testData.json');
const getUserIdItemSchema = require('../data/GET.user.id.item.json');

describe(`GET /user/{id}/item - Returns specific user item by its item id`, function () {
    let token;
    let itemId;

    beforeAll(async () => {
        let response = await axios.post(`${testData.baseUrl}/v1/user/login`, {
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            },
            data: {
                username: faker.internet.userName(),
                password: faker.internet.password()
            }
        });

        token = response.data.token;

        let getUserItemsResponse = await axios.get(`${testData.baseUrl}/user/items`, {
            headers: {
                'accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            params: {
                limit: '10'
            }
        });

        itemId = getUserItemsResponse.data[0].items[1];
    });

    describe(`200 - Item details successfully returned (second item)`, function () {
        let response;

        beforeAll(async () => {
            response = await axios.get(`${testData.baseUrl}/user/${itemId}/item`, {
                headers: {
                    'accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
        });

        test(`Status code is 200`, async () => {
            expect(response.status).to.equal(200);
        });

        test(`JSON schema is valid`, async () => {
            const result = jsonschema.validate(response.data, getUserIdItemSchema);
            expect(result.valid).to.be.true;
        });

        test(`id corresponds to second item's id`, async () => {
            expect(response.data[0].id).to.equal(itemId);
        });

        test(`Title is "${testData.itemTitle}"`, async () => {
            expect(response.data[0].title).to.equal(testData.itemTitle);
        });

        test(`Tags are equal`, async () => {
            expect(response.data[0].tags).to.have.same.members(testData.itemTags);
        });

        test('Files path validation', async () => {
            response.data[0].files.forEach(file => {
                expect(file.content_path).to.contain('vault/');
                expect(file.content_path).to.contain('/files/');
            });
        });
    });

    describe(`401 - Bearer token is missing or invalid`, function () {
        let response;

        beforeAll(async () => {
            response = await axios.get(`${testData.baseUrl}/user/${itemId}/item`, {
                headers: {
                    'accept': 'application/json',
                    'Authorization': `Bearer `
                }
            });
        });

        test(`Status code is 401`, async () => {
            expect(response.status).to.equal(401);
        });

        test(`Error message validation`, async () => {
            expect(response.data[0].error).to.equal(testData.userNotAuthorizedMessage);
        });
    });

    describe(`403 - Access forbidden`, function () {
        let response;

        beforeAll(async () => {
            response = await axios.get(`${testData.baseUrl}/user/${itemId}/item`, {
                headers: {
                    'accept': 'application/json',
                    'Authorization': `Bearer ${testData.forbiddenAccessToken}`
                }
            });
        });

        test(`Status code is 403`, async () => {
            expect(response.status).to.equal(403);
        });

        test(`Error message validation`, async () => {
            expect(response.data[0].error).to.equal(testData.accessForbiddenMessage);
        });
    });

    afterAll(async () => {
        await new Promise(resolve => setTimeout(resolve, 500)); // avoid jest open handle error
    });
});
