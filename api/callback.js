import { decapCallbackHtml, exchangeGithubCode } from './_oauth.js';

const parseCookie = (header = '') =>
  Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim().split('='))
      .filter(([key, value]) => key && value),
  );

export default async function handler(req, res) {
  console.info('[mj-oauth] callback route reached');
  const { code, state } = req.query;
  const cookies = parseCookie(req.headers.cookie);
  const expectedState = cookies.mj_oauth_state;
  const targetOrigin = cookies.mj_oauth_origin ? decodeURIComponent(cookies.mj_oauth_origin) : '*';

  if (!code || !state || !expectedState || state !== expectedState) {
    console.warn('[mj-oauth] callback state invalid');
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(decapCallbackHtml('error', { error: 'Invalid OAuth state.' }, targetOrigin));
    return;
  }

  console.info('[mj-oauth] callback state valid');
  res.setHeader('Set-Cookie', [
    'mj_oauth_state=; HttpOnly; Path=/api; Max-Age=0; SameSite=Lax; Secure',
    'mj_oauth_origin=; HttpOnly; Path=/api; Max-Age=0; SameSite=Lax; Secure',
  ]);

  try {
    const token = await exchangeGithubCode(req, code);
    console.info('[mj-oauth] token exchange success');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(decapCallbackHtml('success', { token }, targetOrigin));
    console.info('[mj-oauth] callback HTML rendered');
  } catch (error) {
    console.error('[mj-oauth] token exchange failed');
    res.statusCode = 502;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(decapCallbackHtml('error', { error: error.message }, targetOrigin));
  }
}
