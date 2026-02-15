import request from 'supertest';
import app from '../src/app';

describe('Suggestions API', () => {
    let accessToken: string;
    let createdSuggestionId: number;
    const candidatePasswords = ['Test1234', 'Test12345'];

    // Test öncesi login ol
    beforeAll(async () => {
        let token: string | null = null;

        for (const password of candidatePasswords) {
            const loginRes = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    employeeId: 'USER001',
                    password
                });

            if (loginRes.status === 200 && loginRes.body?.data?.accessToken) {
                token = loginRes.body.data.accessToken;
                break;
            }
        }

        if (!token) {
            throw new Error('Unable to login with known test passwords');
        }

        accessToken = token;
    });

    describe('POST /api/v1/suggestions', () => {
        it('should create a new suggestion', async () => {
            const res = await request(app)
                .post('/api/v1/suggestions')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    title: 'Test Suggestion for Unit Test',
                    description: 'This is a test suggestion created by automated tests.',
                    currentSituation: 'Current situation description',
                    proposedSolution: 'Proposed solution description',
                    gainCategories: ['QUALITY'] // Assuming QUALITY is a valid GainCategory enum
                });

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.title).toBe('Test Suggestion for Unit Test');

            createdSuggestionId = res.body.data.id;
        });

        it('should fail validation with missing fields', async () => {
            const res = await request(app)
                .post('/api/v1/suggestions')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    title: 'Incomplete Suggestion'
                    // Missing description, etc.
                });

            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/v1/suggestions', () => {
        it('should list suggestions', async () => {
            const res = await request(app)
                .get('/api/v1/suggestions')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data.data)).toBe(true);
            expect(res.body.data.data.length).toBeGreaterThan(0);
        });
    });

    describe('GET /api/v1/suggestions/:id', () => {
        it('should get suggestion details', async () => {
            const res = await request(app)
                .get(`/api/v1/suggestions/${createdSuggestionId}`)
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(createdSuggestionId);
        });

        it('should return 404 for non-existent suggestion', async () => {
            const res = await request(app)
                .get('/api/v1/suggestions/999999')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.status).toBe(404);
        });
    });

    // Cleanup (Optional: Delete created suggestion if DELETE endpoint exists and is allowed)
    // Note: Usually we might want to clean up DB or use a transaction rollback, 
    // but for now we'll leave it as persisting data in test DB (SQLite/Postgres).
});
