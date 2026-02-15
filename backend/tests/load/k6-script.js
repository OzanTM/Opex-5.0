import http from 'k6/http';
import { check, sleep } from 'k6';

// Test Configuration
export const options = {
    stages: [
        { duration: '5s', target: 5 },  // Ramp up to 5 users
        { duration: '10s', target: 20 }, // Stay at 20 users
        { duration: '5s', target: 0 },   // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
        http_req_failed: ['rate<0.01'],   // Error rate must be less than 1%
    },
};

const BASE_URL = 'http://host.docker.internal:3001/api/v1';

export function setup() {
    const loginPayload = JSON.stringify({
        employeeId: 'USER001',
        password: 'Test1234',
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const loginRes = http.post(`${BASE_URL}/auth/login`, loginPayload, params);

    check(loginRes, {
        'Login status is 200': (r) => r.status === 200,
    });

    if (loginRes.status !== 200) {
        console.error(`Login failed in setup. Status: ${loginRes.status}, Body: ${loginRes.body}`);
        // Fail the test if setup fails?? k6 setup doesn't behave like that easily, but subsequent steps will fail.
        return { token: '' };
    }

    return { token: loginRes.json('data.accessToken') };
}

export default function (data) {
    if (!data.token) {
        console.error('No auth token available. Skipping iteration.');
        sleep(1);
        return;
    }

    const authParams = {
        headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json',
        },
    };

    // 2. Get Suggestions (Should be cached)
    const suggestionsRes = http.get(`${BASE_URL}/suggestions`, authParams);
    check(suggestionsRes, {
        'Get Suggestions status is 200': (r) => r.status === 200,
        'Get Suggestions time < 200ms': (r) => r.timings.duration < 200,
    });
    if (suggestionsRes.status !== 200) {
        console.error(`Get Suggestions failed. Status: ${suggestionsRes.status}. Body: ${suggestionsRes.body}`);
    }

    // 3. Get User Profile (Should be cached)
    const profileRes = http.get(`${BASE_URL}/auth/me`, authParams);
    check(profileRes, {
        'Get Profile status is 200': (r) => r.status === 200,
    });

    sleep(1);
}
