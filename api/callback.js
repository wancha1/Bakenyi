/**
 * Serverless Vercel Function: Exchanges GitHub Auth code for an access token.
 * This file should be deployed to /api/callback.js on Vercel.
 */
export default async function handler(req, res) {
  const { code } = req.query;
  const client_id = process.env.GITHUB_CLIENT_ID;
  const client_secret = process.env.GITHUB_CLIENT_SECRET;

  if (!code) {
    return res.status(400).send("No authorization code returned from GitHub.");
  }

  if (!client_id || !client_secret) {
    return res.status(500).send("GitHub client credentials missing from environment.");
  }

  try {
    // Exchange auth code for access_token with GitHub
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id,
        client_secret,
        code,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).send(`GitHub OAuth Error: ${data.error_description || data.error}`);
    }

    const accessToken = data.access_token;

    // Send the token back to the main Decap CMS popup handler via postMessage
    res.setHeader("Content-Type", "text/html");
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>Bakenyi Heritage Authentication Successful</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background-color: #fcfbf7;
              color: #433e37;
              text-align: center;
            }
            .spinner {
              border: 3px solid rgba(0,0,0,.1);
              width: 36px;
              height: 36px;
              border-radius: 50%;
              border-left-color: #bf532c;
              animation: spin 1s linear infinite;
              margin-bottom: 16px;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            h2 { margin: 0 0 8px 0; font-size: 20px; }
            p { margin: 0; color: #7f7360; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <h2>Authentication Successful</h2>
          <p>Writing security token... returning to Bakenyi CMS dashboard.</p>
          
          <script>
            (function() {
              function receiveMessage(e) {
                console.log("PostMessage handshake initiated with origin:", e.origin);
                // Send the OAuth success message payload containing the access token to the parent window
                window.opener.postMessage(
                  'authorization:github:success:' + JSON.stringify({
                    token: "${accessToken}",
                    provider: "github"
                  }),
                  e.origin
                );
                // Clean up listener
                window.removeEventListener("message", receiveMessage);
              }
              
              window.addEventListener("message", receiveMessage, false);
              
              // Inform Decap CMS that authorization is in progress
              window.opener.postMessage("authorizing:github", "*");
            })();
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Token Exchange Failure:", error);
    res.status(500).send("An internal server error occurred during the token exchange handshake.");
  }
}
