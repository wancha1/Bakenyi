/**
 * Serverless Vercel Function: Initiates GitHub OAuth handshake.
 * This file should be deployed to /api/auth.js on Vercel.
 */
export default function handler(req, res) {
  const client_id = process.env.GITHUB_CLIENT_ID;
  
  if (!client_id) {
    return res.status(500).send(`
      <h1>OAuth Configuration Error</h1>
      <p>The environment variable <strong>GITHUB_CLIENT_ID</strong> is not defined on Vercel.</p>
      <p>Please log in to your Vercel Dashboard, navigate to Project Settings &rarr; Environment Variables, and add:</p>
      <ul>
        <li><code>GITHUB_CLIENT_ID</code></li>
        <li><code>GITHUB_CLIENT_SECRET</code></li>
      </ul>
    `);
  }

  // Set permissions scope to standard git/repo control for managing files
  const scope = "repo,user";
  
  // Dynamically build callback redirect URI
  const host = req.headers.host;
  const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https';
  const redirect_uri = `${protocol}://${host}/api/callback`;
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${client_id}&scope=${scope}&redirect_uri=${encodeURIComponent(redirect_uri)}`;
  
  // Redirect popup window to GitHub
  res.redirect(githubAuthUrl);
}
