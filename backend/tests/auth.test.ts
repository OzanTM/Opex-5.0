import request from 'supertest';
import app from '../src/app';

describe('Auth API', () => {
    const employeeId = 'USER001';
    const candidatePasswords = ['Test1234', 'Test12345'];

    let accessToken: string;
    let refreshToken: string;

    const loginWithFallback = async () => {
        for (const password of candidatePasswords) {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({ employeeId, password });

            if (res.status === 200 && res.body?.data?.accessToken) {
                return { res, password };
            }
        }

        throw new Error('Unable to login with known test passwords');
    };

    describe('POST /api/v1/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const { res } = await loginWithFallback();

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('accessToken');
            expect(res.body.data).toHaveProperty('refreshToken');
            expect(res.body.data.user).toHaveProperty('employeeId', employeeId);

            // Tokenları sakla
            accessToken = res.body.data.accessToken;
            refreshToken = res.body.data.refreshToken;
        });

        it('should fail with invalid credentials', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    employeeId,
                    password: 'WrongPassword'
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/auth/refresh', () => {
        it('should refresh token successfully', async () => {
            const res = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('accessToken');
        });

        it('should fail with invalid refresh token', async () => {
            const res = await request(app)
                .post('/api/v1/auth/refresh')
                .send({ refreshToken: 'invalid-token' });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/auth/logout', () => {
        it('should logout successfully', async () => {
            const res = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({ refreshToken });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
