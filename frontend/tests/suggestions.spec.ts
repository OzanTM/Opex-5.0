import { test, expect } from '@playwright/test';

test.describe('Suggestion Lifecycle', () => {
    const bootstrapAuth = async (page: any, request: any) => {
        const apiBaseURL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001/api/v1';
        let response = await request.post(`${apiBaseURL}/auth/login`, {
            data: { employeeId: 'USER001', password: 'Test1234' },
        });
        let body = await response.json();

        if (!response.ok()) {
            response = await request.post(`${apiBaseURL}/auth/login`, {
                data: { employeeId: 'USER001', password: 'Test12345' },
            });
            body = await response.json();
        }

        if (!response.ok()) {
            throw new Error(`API login failed: ${JSON.stringify(body)}`);
        }

        if (body.data.requiresPasswordChange) {
            const tempToken = body.data.accessToken;
            const changeResp = await request.post(`${apiBaseURL}/auth/change-password`, {
                headers: { Authorization: `Bearer ${tempToken}` },
                data: {
                    currentPassword: 'Test1234',
                    newPassword: 'Test12345',
                    confirmPassword: 'Test12345',
                },
            });

            if (!changeResp.ok()) {
                const err = await changeResp.json();
                throw new Error(`Password change failed: ${JSON.stringify(err)}`);
            }

            response = await request.post(`${apiBaseURL}/auth/login`, {
                data: { employeeId: 'USER001', password: 'Test12345' },
            });
            body = await response.json();

            if (!response.ok()) {
                throw new Error(`Re-login failed: ${JSON.stringify(body)}`);
            }
        }

        const authState = {
            state: {
                user: body.data.user,
                accessToken: body.data.accessToken,
                refreshToken: body.data.refreshToken,
                isAuthenticated: true,
                isLoading: false,
            },
            version: 0,
        };

        await page.addInitScript(({ authState, accessToken, refreshToken }) => {
            localStorage.setItem('opex-auth', JSON.stringify(authState));
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
        }, {
            authState,
            accessToken: body.data.accessToken,
            refreshToken: body.data.refreshToken,
        });
    };

    test('should create a new suggestion and see it in the list', async ({ page, request }) => {
        // Setup console listener
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

        await bootstrapAuth(page, request);

        // 1. Navigate to New Suggestion Page
        await page.goto('/suggestions/new');
        await page.waitForLoadState('domcontentloaded');

        // DEBUG: Check Local Storage
        const localStorageData = await page.evaluate(() => JSON.stringify(localStorage));
        console.log('DEBUG: LocalStorage content:', localStorageData);

        // DEBUG: Check Header
        const headerVisible = await page.getByRole('heading', { name: 'Yeni Öneri Oluştur' }).isVisible();
        console.log('DEBUG: Header "Yeni Öneri Oluştur" visible:', headerVisible);

        if (!headerVisible) {
            console.log('DEBUG: Header not visible. Current URL:', page.url());
            console.log('DEBUG: Page Text:', await page.evaluate(() => document.body.innerText));
            throw new Error('Header not visible, possible auth or render issue');
        }

        // 2. Fill the form
        const uniqueTitle = `Test Suggestion ${Date.now()}`;
        console.log('DEBUG: Filling title...');
        await page.getByPlaceholder('Önerinizin kısa ve açıklayıcı bir başlığını yazın').fill(uniqueTitle);

        await page.locator('select').first().selectOption('KAIZEN');
        await page.getByPlaceholder('Önerdiğiniz çözümü detaylı olarak açıklayın').fill('This is a test suggestion created by Playwright E2E test.');
        await page.getByPlaceholder('Şu anki durumu detaylı olarak açıklayın. Sorun veya iyileştirme alanı nedir?').fill('Current situation description.');
        await page.getByRole('checkbox', { name: 'Maliyet Tasarrufu' }).check();

        // 3. Submit
        await page.getByRole('button', { name: /Kaydet ve Gönder/ }).click();

        // 4. Verify Success Toast or Redirect
        // Assuming redirection to list page or toast message
        // If redirect to list:
        await page.waitForURL('**/suggestions');

        // 5. Check if the suggestion appears in the list
        // Reload to ensure list is updated if not implicit
        await page.reload();
        await expect(page.getByText(uniqueTitle)).toBeVisible();
    });

});
