import { randomUUID } from 'node:crypto';
import { createGithubAuthorizeUrl } from './_oauth.js';

export default function handler(req, res) {
  try {
    const state = randomUUID();
    const secure = (req.headers['x-forwarded-proto'] || 'https') === 'https' ? '; Secure' : '';
    res.setHeader('Set-Cookie', `mj_oauth_state=${state}; HttpOnly; Path=/api; Max-Age=600; SameSite=Lax${secure}`);
    res.statusCode = 302;
    res.setHeader('Location', createGithubAuthorizeUrl(req, state));
    res.end();
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end(error.message);
  }
}
