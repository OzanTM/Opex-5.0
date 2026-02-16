import request from 'supertest';
import app from '../src/app';

describe('Backend Smoke Test', () => {
    it('should return healthy status', async () => {
        const res = await request(app).get('/api/v1/health');

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should expose OpenAPI JSON document', async () => {
        const res = await request(app).get('/api-docs.json');

        expect(res.status).toBe(200);
        expect(res.body.openapi).toBe('3.0.3');
        expect(res.body.paths).toBeDefined();
        expect(res.body.paths['/reports/export/excel']).toBeDefined();
        expect(res.body.paths['/reports/export/pdf']).toBeDefined();
    });
});
