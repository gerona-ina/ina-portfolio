// Netlify Function: inquiry-to-github
//
// Triggered by a Netlify Forms "Outgoing webhook" notification whenever
// someone submits the Inquiries form. It takes the submitted fields and
// opens a GitHub Issue in this repo, so every inquiry is logged alongside
// the code (and gets the built-in issue notification emails too).
//
// Required environment variable (set in Netlify: Site settings > Environment
// variables — never commit this to the repo):
//   GITHUB_TOKEN — a GitHub Personal Access Token with "repo" scope
//                  (fine-grained: Issues: Read and write) for this repo.

const GITHUB_OWNER = "gerona-ina";
const GITHUB_REPO = "ina-portfolio";
const GITHUB_API_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error("Missing GITHUB_TOKEN environment variable");
    return { statusCode: 500, body: "Server misconfigured" };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: "Invalid JSON payload" };
  }

  // Netlify's outgoing webhook wraps the form data as payload.data
  const data = payload && payload.data ? payload.data : {};
  const name = (data.name || "Unknown").trim();
  const contact = (data.contact || "No contact info given").trim();
  const subject = (data.subject || "No subject").trim();
  const message = (data.message || "").trim();

  const title = `Inquiry: ${subject} — from ${name}`;
  const body = [
    `**Name:** ${name}`,
    `**Contact:** ${contact}`,
    `**Subject:** ${subject}`,
    "",
    "**Message:**",
    message,
    "",
    "---",
    "_Filed automatically from the Inquiries form._",
  ].join("\n");

  try {
    const response = await fetch(GITHUB_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "ina-portfolio-inquiries-function",
      },
      body: JSON.stringify({
        title,
        body,
        labels: ["inquiry"],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("GitHub API error:", response.status, errText);
      return { statusCode: 502, body: "Failed to create GitHub issue" };
    }

    const issue = await response.json();
    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, issueUrl: issue.html_url }),
    };
  } catch (err) {
    console.error("Unexpected error creating GitHub issue:", err);
    return { statusCode: 500, body: "Unexpected error" };
  }
};
