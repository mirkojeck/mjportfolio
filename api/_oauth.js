const githubAuthorizeUrl = 'https://github.com/login/oauth/authorize';
const githubTokenUrl = 'https://github.com/login/oauth/access_token';

export const getRequiredEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
};

export const getOAuthRedirectUri = (req) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return process.env.OAUTH_REDIRECT_URI || `${proto}://${host}/api/callback`;
};

export const createGithubAuthorizeUrl = (req, state) => {
  const authorizeUrl = new URL(githubAuthorizeUrl);
  authorizeUrl.searchParams.set('client_id', getRequiredEnv('GITHUB_CLIENT_ID'));
  authorizeUrl.searchParams.set('redirect_uri', getOAuthRedirectUri(req));
  authorizeUrl.searchParams.set('scope', 'repo');
  authorizeUrl.searchParams.set('state', state);
  return authorizeUrl.toString();
};

export const exchangeGithubCode = async (req, code) => {
  const response = await fetch(githubTokenUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: getRequiredEnv('GITHUB_CLIENT_ID'),
      client_secret: getRequiredEnv('GITHUB_CLIENT_SECRET'),
      code,
      redirect_uri: getOAuthRedirectUri(req),
    }),
  });

  const payload = await response.json();
  if (!response.ok || payload.error || !payload.access_token) {
    throw new Error(payload.error_description || payload.error || 'GitHub token exchange failed');
  }

  return payload.access_token;
};

export const decapCallbackHtml = (status, payload) => {
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;
  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>GitHub OAuth</title></head>
  <body>
    <script>
      (function () {
        var message = ${JSON.stringify(message)};
        if (window.opener) {
          window.opener.postMessage(message, window.location.origin);
          window.close();
        } else {
          document.body.textContent = ${JSON.stringify(status === 'success' ? 'Authentication complete. You can close this window.' : 'Authentication failed.')};
        }
      })();
    </script>
  </body>
</html>`;
};
