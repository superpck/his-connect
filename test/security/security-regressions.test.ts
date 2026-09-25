import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { authenticateRequest } from '../../src/middleware/authenticate';
import { buildReportQuery } from '../../src/models/isonline/report';
import { IswinModel } from '../../src/models/isonline/iswin';

function createReply() {
  return {
    sent: false,
    statusCode: 200,
    payload: undefined,
    code(statusCode: number) {
      this.statusCode = statusCode;
      return this;
    },
    status(statusCode: number) {
      return this.code(statusCode);
    },
    send(payload: unknown) {
      this.sent = true;
      this.payload = payload;
      return this;
    }
  };
}

for (const [name, error] of [
  ['missing', new Error('missing token')],
  ['invalid', new Error('invalid signature')],
  ['malformed', new Error('malformed token')],
  ['expired', new Error('jwt expired')]
]) {
  test(`authentication rejects ${name} tokens before a handler can mutate data`, async () => {
    const reply = createReply();
    const request = {
      body: {},
      headers: {},
      jwtVerify: async () => {
        throw error;
      }
    };

    const result = await authenticateRequest(request, reply);

    assert.equal(reply.sent, true);
    assert.equal(reply.statusCode, 401);
    assert.equal(result, reply);
    assert.equal(request.user, null);
  });
}

test('report query keeps untrusted values out of SQL and binds every condition', () => {
  const query = buildReportQuery(
    'select * from `is` <where>',
    'select * from <sql>',
    '',
    {
      hospCode: '10670',
      date1: '2026-09-01',
      date2: '2026-09-02',
      region: '1',
      changwat: '10'
    }
  );

  assert.equal(query.sql, 'select * from (select * from `is` where hosp = ? and adate between ? and ?) where region = ? and changwatcode = ?');
  assert.deepEqual(query.bindings, ['10670', '2026-09-01 00:00:00', '2026-09-02 23:59:59', '1', '10']);
  assert.throws(() => buildReportQuery('select * from `is` <where>', '', '', {
    hospCode: "10670' OR 1=1 --",
    date1: '2026-09-01',
    date2: '2026-09-02'
  }), /Invalid hospital code/);
  assert.throws(() => buildReportQuery('select * from `is` <where>', '', '', {
    hospCode: '10670',
    date1: '2026-09-01',
    date2: '2026-09-02',
    region: "' OR 1=1 --"
  }), /Invalid region/);
});

test('generic raw SQL model API is unavailable', () => {
  const model: any = new IswinModel();
  assert.equal(typeof model.selectSql, 'undefined');
  assert.equal(typeof model.selectSqlK, 'undefined');
});

test('generic raw SQL route is not registered', () => {
  const paths: string[] = [];
  const isOnlineRouter = require('../../src/routes/isonline');
  isOnlineRouter({
    authenticate: authenticateRequest,
    get(path: string) {
      paths.push(path);
    },
    post(path: string) {
      paths.push(path);
    }
  }, {}, () => undefined);

  assert.equal(paths.includes('/selectData'), false);
});

test('user mutation routes use the shared authentication pre-handler', () => {
  const routes: Array<{ path: string; options: any }> = [];
  const userRouter = require('../../src/routes/isonline/user');
  userRouter({
    authenticate: authenticateRequest,
    post(path: string, options: any) {
      routes.push({ path, options });
    }
  }, {}, () => undefined);

  for (const path of ['/save', '/remove']) {
    const route = routes.find((candidate) => candidate.path === path);
    assert.ok(route);
    assert.deepEqual(route.options.preHandler, [authenticateRequest]);
  }
});

test('API login rejects spoofed proxy headers without valid credentials', async () => {
  const mophRefer = require('../../src/middleware/moph-refer');
  const { IsLoginModel } = require('../../src/models/isonline/login');
  const originalCheckSignInCode = mophRefer.checkSignInCode;
  const originalDoLogin = IsLoginModel.prototype.doLogin;
  const routes: Array<{ path: string; handler: Function }> = [];

  mophRefer.checkSignInCode = async () => true;
  IsLoginModel.prototype.doLogin = async () => [];
  try {
    const loginModule = require('../../src/routes/isonline/login');
    const loginRouter = typeof loginModule === 'function' ? loginModule : loginModule.default;
    loginRouter({
      jwt: { sign: () => 'signed-token' },
      post(path: string, handler: Function) {
        routes.push({ path, handler });
      }
    }, {}, () => undefined);

    const route = routes.find((candidate) => candidate.path === '/api-login');
    assert.ok(route);
    const reply = createReply();
    await route.handler({
      body: { username: '10670', password: 'not-valid', code: 'valid-code' },
      headers: { 'x-forwarded-for': '127.0.0.1', 'x-real-ip': '203.157.103.55' }
    }, reply);

    assert.equal(reply.statusCode, 401);
    assert.equal(reply.sent, true);
  } finally {
    mophRefer.checkSignInCode = originalCheckSignInCode;
    IsLoginModel.prototype.doLogin = originalDoLogin;
  }
});

test('API login derives the JWT hospital code from verified account data', async () => {
  const mophRefer = require('../../src/middleware/moph-refer');
  const { IsLoginModel } = require('../../src/models/isonline/login');
  const originalCheckSignInCode = mophRefer.checkSignInCode;
  const originalDoLogin = IsLoginModel.prototype.doLogin;
  const routes: Array<{ path: string; handler: Function }> = [];
  let receivedPasswordHash = '';

  mophRefer.checkSignInCode = async () => true;
  IsLoginModel.prototype.doLogin = async (_db: unknown, _username: string, passwordHash: string) => {
    receivedPasswordHash = passwordHash;
    return [{ hcode: '10670' }];
  };
  try {
    const loginModule = require('../../src/routes/isonline/login');
    const loginRouter = typeof loginModule === 'function' ? loginModule : loginModule.default;
    loginRouter({
      jwt: {
        sign(payload: unknown) {
          return JSON.stringify(payload);
        }
      },
      post(path: string, handler: Function) {
        routes.push({ path, handler });
      }
    }, {}, () => undefined);

    const route = routes.find((candidate) => candidate.path === '/api-login');
    assert.ok(route);
    const reply = createReply();
    await route.handler({
      body: { username: 'account-name', password: 'verified-password', code: 'valid-code' },
      headers: { 'x-forwarded-for': '127.0.0.1' }
    }, reply);

    assert.equal(receivedPasswordHash, createHash('sha256').update('verified-password').digest('hex'));
    assert.equal(JSON.parse((reply.payload as any).token).hcode, '10670');
  } finally {
    mophRefer.checkSignInCode = originalCheckSignInCode;
    IsLoginModel.prototype.doLogin = originalDoLogin;
  }
});
