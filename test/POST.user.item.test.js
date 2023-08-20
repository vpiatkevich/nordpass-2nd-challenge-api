const axios = require('axios');
const { expect } = require('chai');
const { faker } = require('@faker-js/faker');
const jsonschema = require('jsonschema');
const testData = require('../testData.json');
const postUserItemSchema = require('../data/POST.user.item.json');

describe(`POST /user/item - Creates specific item`, function () {
    let token;

    beforeAll(async () => {
        const response = await axios.post(`${testData.baseUrl}/v1/user/login`, {
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
    });

    const newItemData = {
        id: testData.newItemId,
        title: testData.newItemTitle,
        tags: [testData.newItemTag],
        files: [
            {
                id: testData.newFileId,
                name: testData.newFileName,
                size: testData.newFileSize,
                content_path: testData.newFileContentPath
            }
        ],
        fields: [
            {
                id: testData.newFieldId,
                label: testData.newFieldLabel,
                type: testData.newFieldType,
                value: testData.newFieldValue
            }
        ]
    };

    describe(`201 - Item successfully created`, function () {
        let response;

        beforeAll(async () => {
            response = await axios.post(`${testData.baseUrl}/user/item`, newItemData, {
                headers: {
                    'accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        });

        test(`Status code is 201`, async () => {
            expect(response.status).to.equal(201);
        });

        test(`JSON schema is valid`, async () => {
            const result = jsonschema.validate(response.data, postUserItemSchema);
            expect(result.valid).to.be.true;
        });

        test(`GET /user/items endpoint returns a new item`, async () => {
            await new Promise((resolve) => setTimeout(resolve, 10000));

            const itemsResponse = await axios.get(`${testData.baseUrl}/user/items`, {
                headers: {
                    'accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                params: {
                    limit: 500
                }
            });

            expect(itemsResponse.data[0].items).to.include(testData.newItemId);
        });
    });

    describe(`401 - Bearer token is missing or invalid`, function () {
        let response;

        beforeAll(async () => {
            response = await axios.post(`${testData.baseUrl}/user/item`, newItemData, {
                headers: {
                    'accept': 'application/json',
                    'Authorization': `Bearer `,
                    'Content-Type': 'application/json'
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
            response = await axios.post(`${testData.baseUrl}/user/item`, newItemData, {
                headers: {
                    'accept': 'application/json',
                    'Authorization': `Bearer ${testData.forbiddenAccessToken}`,
                    'Content-Type': 'application/json'
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
