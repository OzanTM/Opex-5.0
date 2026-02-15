import request from 'supertest';
import app from '../src/app';

const parseBinary = (res: any, callback: (err: Error | null, body: Buffer) => void) => {
    const chunks: Buffer[] = [];
    res.on('data', (chunk: Buffer) => chunks.push(Buffer.from(chunk)));
    res.on('end', () => callback(null, Buffer.concat(chunks)));
};

describe('Reports Export API Contract', () => {
    let accessToken: string;
    const candidatePasswords = ['Test1234', 'Test12345'];

    beforeAll(async () => {
        let token: string | null = null;

        for (const password of candidatePasswords) {
            const loginRes = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    employeeId: 'USER001',
                    password,
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

    it('exports Excel as downloadable xlsx file', async () => {
        const res = await request(app)
            .get('/api/v1/reports/export/excel')
            .set('Authorization', `Bearer ${accessToken}`)
            .buffer(true)
            .parse(parseBinary);

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        expect(res.headers['content-disposition']).toContain('.xlsx');
        expect(Buffer.isBuffer(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it('exports PDF as downloadable pdf file', async () => {
        const res = await request(app)
            .get('/api/v1/reports/export/pdf')
            .set('Authorization', `Bearer ${accessToken}`)
            .buffer(true)
            .parse(parseBinary);

        expect(res.status).toBe(200);
        expect(res.headers['content-type']).toContain('application/pdf');
        expect(res.headers['content-disposition']).toContain('.pdf');
        expect(Buffer.isBuffer(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it('keeps legacy suggestions export endpoint with deprecation headers', async () => {
        const res = await request(app)
            .get('/api/v1/reports/export/suggestions')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.headers['deprecation']).toBe('true');
        expect(res.headers['sunset']).toBeDefined();
        expect(res.headers['link']).toContain('/api/v1/reports/export/excel');
    });

    it('keeps legacy projects export endpoint with deprecation headers', async () => {
        const res = await request(app)
            .get('/api/v1/reports/export/projects')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.headers['deprecation']).toBe('true');
        expect(res.headers['sunset']).toBeDefined();
        expect(res.headers['link']).toContain('/api/v1/reports/export/pdf');
    });
});
