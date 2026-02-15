import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authFile = 'playwright/.auth/user.json';
const apiBaseURL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:3001/api/v1';

setup('authenticate', async ({ request, page }) => {
    let response;
    let user;

    // 1. Try Login with Default Password
    console.log('Attempting login with default credentials...');
    response = await request.post(`${apiBaseURL}/auth/login`, {
        data: {
            employeeId: 'USER001',
            password: 'Test1234'
        }
    });

    let body = await response.json();

    // 2. If Login Failed, Try New Password
    if (!response.ok()) {
        console.log('Default login failed. Attempting with new password...');
        response = await request.post(`${apiBaseURL}/auth/login`, {
            data: {
                employeeId: 'USER001',
                password: 'Test12345'
            }
        });
        body = await response.json();
    }

    if (!response.ok()) {
        throw new Error(`Login failed even with new password: ${JSON.stringify(body)}`);
    }

    // 3. Check if Password Change is Required
    if (body.data.requiresPasswordChange) {
        console.log('Password change required. Changing password...');
        // We need the temp token to change password
        const tempToken = body.data.accessToken;

        const changePwdResponse = await request.post(`${apiBaseURL}/auth/change-password`, {
            headers: {
                'Authorization': `Bearer ${tempToken}`
            },
            data: {
                currentPassword: 'Test1234',
                newPassword: 'Test12345',
                confirmPassword: 'Test12345'
            }
        });

        if (!changePwdResponse.ok()) {
            const err = await changePwdResponse.json();
            throw new Error(`Password change failed: ${JSON.stringify(err)}`);
        }

        console.log('Password changed successfully. Re-logging in...');

        // Re-login to get fresh tokens
        response = await request.post(`${apiBaseURL}/auth/login`, {
            data: {
                employeeId: 'USER001',
                password: 'Test12345'
            }
        });
        body = await response.json();

        if (!response.ok()) {
            throw new Error(`Re-login after password change failed: ${JSON.stringify(body)}`);
        }
    }

    // 4. Extract User and Tokens
    user = body.data.user;
    const accessToken = body.data.accessToken;
    const refreshToken = body.data.refreshToken;

    console.log(`Authenticated as ${user.firstName} ${user.lastName}`);

    // 5. Populate LocalStorage for Frontend (Zustand Store)
    // We need to navigate to the domain first to set localStorage
    await page.goto('/login');

    const authState = {
        state: {
            user: user,
            accessToken: accessToken,
            refreshToken: refreshToken,
            isAuthenticated: true,
            isLoading: false
        },
        version: 0
    };

    await page.evaluate(({ authState, accessToken, refreshToken }) => {
        localStorage.setItem('opex-auth', JSON.stringify(authState));
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
    }, { authState, accessToken, refreshToken });

    // 6. Reload so the app rehydrates auth state from localStorage
    await page.reload({ waitUntil: 'domcontentloaded' });

    // 7. Save Storage State
    fs.mkdirSync(path.dirname(authFile), { recursive: true });
    await page.context().storageState({ path: authFile });
});
