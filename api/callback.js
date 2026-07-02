import { decapCallbackHtml, exchangeGithubCode } from './_oauth.js';

const parseCookie = (header = '') =>
  Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim().split('='))
      .filter(([key, value]) => key && value),
  );

export default async function handler(req, res) {
  const { code, state } = req.query;
  const expectedState = parseCookie(req.headers.cookie).mj_oauth_state;

  if (!code || !state || !expectedState || state !== expectedState) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(decapCallbackHtml('error', { error: 'Invalid OAuth state.' }));
    return;
  }

  res.setHeader('Set-Cookie', 'mj_oauth_state=; HttpOnly; Path=/api; Max-Age=0; SameSite=Lax; Secure');

  try {
    const token = await exchangeGithubCode(req, code);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(decapCallbackHtml('success', { token }));
  } catch (error) {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(decapCallbackHtml('error', { error: error.message }));
  }
}
