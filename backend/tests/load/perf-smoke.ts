import autocannon, { Result } from 'autocannon';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001/api/v1';
const EMPLOYEE_ID = process.env.PERF_EMPLOYEE_ID || 'USER001';
const PASSWORDS = (process.env.PERF_PASSWORDS || process.env.PERF_PASSWORD || 'Test1234,Test12345')
  .split(',')
  .map((password) => password.trim())
  .filter(Boolean);

const CONNECTIONS = Number(process.env.PERF_CONNECTIONS || 20);
const REQUEST_AMOUNT = Number(process.env.PERF_REQUEST_AMOUNT || 50);
const P95_LIMIT_MS = Number(process.env.PERF_P95_LIMIT_MS || 500);
const P99_LIMIT_MS = Number(process.env.PERF_P99_LIMIT_MS || 1000);

function fail(message: string): never {
  console.error(`[perf-smoke][error] ${message}`);
  process.exit(1);
}

async function tryLogin(password: string): Promise<string | null> {
  const loginUrl = `${BASE_URL}/auth/login`;

  const response = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      employeeId: EMPLOYEE_ID,
      password,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }
    const body = await response.text();
    fail(`Login failed (${response.status}). URL=${loginUrl} body=${body}`);
  }

  const json = await response.json() as {
    data?: { accessToken?: string };
  };

  const token = json?.data?.accessToken;
  if (!token) {
    fail(`Login succeeded but accessToken is missing in response for employee ${EMPLOYEE_ID}.`);
  }

  return token;
}

async function loginAndGetToken(): Promise<string> {
  for (const password of PASSWORDS) {
    const token = await tryLogin(password);
    if (token) {
      return token;
    }
  }

  fail(`Login failed for employee ${EMPLOYEE_ID} with configured PERF_PASSWORDS candidates.`);
}

function runLoadTest(token: string): Promise<Result> {
  return new Promise<Result>((resolve, reject) => {
    const instance = autocannon({
      url: `${BASE_URL}/suggestions`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      connections: CONNECTIONS,
      amount: REQUEST_AMOUNT,
      pipelining: 1,
      timeout: 10,
      renderProgressBar: true,
      renderResultsTable: true,
      setupClient: (client) => {
        client.on('response', (statusCode) => {
          if (statusCode >= 500) {
            // Logged in summary via result.errors/non2xx; no per-request spam needed.
          }
        });
      },
    });

    instance.on('done', (result) => resolve(result));
    instance.on('error', (error) => reject(error));
  });
}

async function main() {
  console.log('[perf-smoke] Starting performance smoke test...');
  console.log(`[perf-smoke] Base URL: ${BASE_URL}`);
  console.log(`[perf-smoke] Connections: ${CONNECTIONS}, Request amount: ${REQUEST_AMOUNT}`);
  console.log(`[perf-smoke] Thresholds: p95<${P95_LIMIT_MS}ms, p99<${P99_LIMIT_MS}ms`);
  console.log(`[perf-smoke] Login employee: ${EMPLOYEE_ID}`);

  const token = await loginAndGetToken();
  const result = await runLoadTest(token);

  const p95 = Number(result.latency.p95 || 0);
  const p99 = Number(result.latency.p99 || 0);
  const errorCount = Number(result.errors || 0);
  const non2xx = Number(result.non2xx || 0);

  console.log(`[perf-smoke] Result: p95=${p95}ms p99=${p99}ms errors=${errorCount} non2xx=${non2xx}`);

  const failures: string[] = [];

  if (p95 > P95_LIMIT_MS) {
    failures.push(`p95 ${p95}ms exceeded limit ${P95_LIMIT_MS}ms`);
  }

  if (p99 > P99_LIMIT_MS) {
    failures.push(`p99 ${p99}ms exceeded limit ${P99_LIMIT_MS}ms`);
  }

  if (errorCount > 0) {
    failures.push(`autocannon error count is ${errorCount}`);
  }

  if (non2xx > 0) {
    failures.push(`non-2xx response count is ${non2xx} (tip: rate limit hits can be reduced with lower PERF_REQUEST_AMOUNT/PERF_CONNECTIONS)`);
  }

  if (failures.length > 0) {
    fail(failures.join(' | '));
  }

  console.log('[perf-smoke] PASS');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  fail(message);
});
