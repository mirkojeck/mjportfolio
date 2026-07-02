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
  const requestOrigin = getRequestOrigin(req);
  const configuredRedirectUri = process.env.OAUTH_REDIRECT_URI;

  if (!configuredRedirectUri) {
    return `${requestOrigin}/api/callback`;
  }

  try {
    const configured = new URL(configuredRedirectUri);
    const current = new URL(requestOrigin);
    const configuredHost = configured.host.replace(/^www\./, '');
    const currentHost = current.host.replace(/^www\./, '');

    if (configured.host !== current.host && configuredHost === currentHost) {
      return `${requestOrigin}/api/callback`;
    }
  } catch {
    return `${requestOrigin}/api/callback`;
  }

  return configuredRedirectUri;
};

export const getRequestOrigin = (req) => {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
};

export const getAdminOrigin = (req) => {
  const queryOrigin = req.query?.origin;
  if (queryOrigin) {
    try {
      return new URL(queryOrigin).origin;
    } catch {
      return '';
    }
  }

  const referer = req.headers.referer;
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      return '';
    }
  }

  return getRequestOrigin(req);
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

export const decapCallbackHtml = (status, payload, targetOrigin = '*') => {
  const message =
    status === 'success'
      ? `authorization:github:success:${JSON.stringify({ token: payload.token })}`
      : `authorization:github:error:${JSON.stringify({ error: payload.error || 'Authentication failed' })}`;
  const safeTargetOrigin = targetOrigin || '*';

  return `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8"><title>GitHub OAuth</title></head>
  <body>
    <script>
      (function () {
        var provider = 'github';
        var handshake = 'authorizing:' + provider;
        var message = ${JSON.stringify(message)};
        var targetOrigin = ${JSON.stringify(safeTargetOrigin)};
        var sent = false;

        function sendAuthorization() {
          if (sent || !window.opener) return;
          sent = true;
          window.opener.postMessage(message, targetOrigin);
          window.setTimeout(function () {
            window.close();
          }, 500);
        }

        if (window.opener) {
          window.addEventListener('message', function (event) {
            if (targetOrigin !== '*' && event.origin !== targetOrigin) return;
            if (event.data === handshake) {
              sendAuthorization();
            }
          });
          window.opener.postMessage(handshake, targetOrigin);
          window.setTimeout(sendAuthorization, 3000);
        } else {
          document.body.textContent = ${JSON.stringify(status === 'success' ? 'Authentication complete. You can close this window.' : 'Authentication failed.')};
        }
      })();
    </script>
  </body>
</html>`;
};
