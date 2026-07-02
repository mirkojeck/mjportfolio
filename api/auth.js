import { randomUUID } from 'node:crypto';
import { createGithubAuthorizeUrl, getAdminOrigin } from './_oauth.js';

export default function handler(req, res) {
  try {
    console.info('[mj-oauth] auth route reached');
    const state = randomUUID();
    const origin = getAdminOrigin(req);
    const secure = (req.headers['x-forwarded-proto'] || 'https') === 'https' ? '; Secure' : '';
    res.setHeader('Set-Cookie', [
      `mj_oauth_state=${state}; HttpOnly; Path=/api; Max-Age=600; SameSite=Lax${secure}`,
      `mj_oauth_origin=${encodeURIComponent(origin)}; HttpOnly; Path=/api; Max-Age=600; SameSite=Lax${secure}`,
    ]);
    res.statusCode = 302;
    res.setHeader('Location', createGithubAuthorizeUrl(req, state));
    res.end();
  } catch (error) {
    console.error('[mj-oauth] auth route failed');
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(error.message);
  }
}
