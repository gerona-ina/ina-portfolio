// Netlify Function: create-entry
//
// Called by admin.html. Takes a new project/writing entry submitted through
// the admin form and commits it straight to the GitHub repo as a new HTML
// file, using the same GITHUB_TOKEN env var already set up for the
// inquiries-to-GitHub-issue function.
//
// Access control: this function requires a valid Netlify Identity user
// (checked via context.clientContext.user, which Netlify populates
// automatically from the Authorization: Bearer <jwt> header when Identity
// is enabled for the site). Make sure Identity's registration is set to
// "Invite only" in Netlify site settings, so random visitors can't sign
// themselves up and publish content.

const GITHUB_OWNER = "gerona-ina";
const GITHUB_REPO = "ina-portfolio";
const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents`;

const VALID_TYPES = ["projects", "writing"];
const VALID_CATEGORIES = ["technical", "personal"];
const FILENAME_PATTERN = /^[a-z0-9-]+$/;

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Builds the full HTML page for a new entry, matching the site's existing
// hand-written entry format (see writing/personal/poetry/poem-05.html).
function buildEntryHtml({ title, date, body }) {
  const paragraphs = body
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `            <p> ${escapeHtml(line)} </p>`)
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>${escapeHtml(title)} — Ina</title>

    <link rel="stylesheet" href="../../style.css">
</head>

<body>

    <main class="poem-entry">

        <h1> ${escapeHtml(title)} </h1>

        <p class="date"> ${escapeHtml(date || "")}</p>

        <div class="poem">
${paragraphs}
        </div>

    </main>

</body>

</html>
`;
}

async function githubPutFile(path, contentBase64, message, token) {
  const response = await fetch(`${GITHUB_API_BASE}/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "ina-portfolio-admin-function",
    },
    body: JSON.stringify({
      message,
      content: contentBase64,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`GitHub API error creating ${path}: ${response.status} ${errText}`);
  }

  return response.json();
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Identity check — context.clientContext.user is populated by Netlify
  // when a valid Identity JWT is sent in the Authorization header.
  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: "Not logged in." }) };
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("Missing GITHUB_TOKEN environment variable");
    return { statusCode: 500, body: JSON.stringify({ error: "Server misconfigured." }) };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON." }) };
  }

  const { type, category, filename, title, date, body, imageBase64, imageExt } = data;

  if (!VALID_TYPES.includes(type)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid type." }) };
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid category." }) };
  }
  if (!filename || !FILENAME_PATTERN.test(filename)) {
    return { statusCode: 400, body: JSON.stringify({ error: "File name must be lowercase letters, numbers, and hyphens only." }) };
  }
  if (!title || !title.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: "Title is required." }) };
  }
  if (!body || !body.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: "Body is required." }) };
  }

  const entryPath = `${type}/${category}/${filename}.html`;
  const html = buildEntryHtml({ title, date, body });
  const htmlBase64 = Buffer.from(html, "utf-8").toString("base64");

  try {
    await githubPutFile(
      entryPath,
      htmlBase64,
      `Add entry: ${title} (via admin panel, ${user.email})`,
      token
    );

    if (imageBase64 && imageExt) {
      const imagePath = `images/${filename}.${imageExt}`;
      await githubPutFile(
        imagePath,
        imageBase64,
        `Add thumbnail for: ${title} (via admin panel, ${user.email})`,
        token
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, path: entryPath }),
    };

  } catch (error) {
    console.error(error);
    return {
      statusCode: 502,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
