exports.handler = async (event) => {
  const params = new URLSearchParams({
    client_id: process.env.OAUTH_GITHUB_CLIENT_ID,
    redirect_uri: `https://arkiv-ina.net/.netlify/functions/oauth-callback`,
    scope: "repo",
    state: Math.random().toString(36).substring(2),
  });
  return {
    statusCode: 302,
    headers: { Location: `https://github.com/login/oauth/authorize?${params}` },
  };
};