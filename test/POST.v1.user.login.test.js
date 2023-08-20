const axios = require('axios');
const { expect } = require('chai');
const { faker } = require('@faker-js/faker');
const jwtDecode = require('jwt-decode');
const jsonschema = require('jsonschema');
const testData = require('../testData.json');
const postV1UserLoginSchema = require('../data/POST.v1.user.login.json');

describe(`POST /v1/user/login - Generates session token (JWT)`, function () {

    describe(`200 - Succesful login`, function () {
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

        test(`Status code is 200`, async () => {
            expect(response.status).to.equal(200)
        })

        test(`JSON schema is valid`, async () => {
            const result = jsonschema.validate(response.data, postV1UserLoginSchema);
            expect(result.valid).to.be.true;
        })

        test(`JWT payload - user_uuid assertion`, async () => {
            let decodedToken = jwtDecode(token);
            expect(decodedToken.user_uuid).to.be.a('string').and.have.lengthOf(36);
        })
    })

    describe(`400 - Invalid login request (username and password are empty)`, function () {
        let response;

        beforeAll(async () => {
            response = await axios.post(`${testData.baseUrl}/v1/user/login`, {
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                  },
                data: {
                    "username": "",
                    "password": ""
                }
            })

        });

        test(`status code is 400`, async () => {
            expect(response.status).to.equal(400)
        })
    })
    
    describe(`429 - Exceeding allowed number of login attempts (x-rate-limit)`, function () {
        let xRateLimit;
        let response;
        let randomUsername = faker.internet.userName();
        let randomPassword = faker.internet.password();

        beforeAll(async () => {
            response = await axios.post(`${testData.baseUrl}/v1/user/login`, {
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json'
                  },
                data: {
                    "username": randomUsername,
                    "password": randomPassword
                }
            })

            xRateLimit = parseInt(response.headers['x-rate-limit'], 10);
        });

        test(`Login is forbidden after x-rate-limit is exceeded`, async () => {
            let response;
            for (let attempt = 1; attempt <= xRateLimit; attempt++) {
                try {
                    response = await axios.post(`${testData.baseUrl}/v1/user/login`, {
                        headers: {
                            'accept': 'application/json',
                            'Content-Type': 'application/json'
                        },
                        data: {
                            "username": randomUsername,
                            "password": randomPassword
                        }
                    });
                } catch (error) {
                    if (error.response) {
                        response = error.response;
                    } else {
                        throw error;
                    }
                }

                if (attempt === xRateLimit) {
                    expect(response.status).to.equal(429);
                }
            }
        })
    })

    afterAll(async () => {
        await new Promise(resolve => setTimeout(() => resolve(), 500)); // avoid jest open handle error
      });
})
