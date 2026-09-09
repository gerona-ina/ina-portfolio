# Setting up the Inquiries form

New files added:
- `inquiries.html` — the form page (linked from nav as INQUIRIES)
- `inquiry-sent.html` — thank-you page shown after a successful submit
- `netlify.toml` — tells Netlify where the serverless functions live
- `netlify/functions/inquiry-to-github.js` — files each submission as a GitHub Issue

## 1. Move hosting to Netlify

1. Go to https://app.netlify.com → **Add new site → Import an existing project**.
2. Connect your GitHub account and pick `gerona-ina/ina-portfolio`.
3. Build settings: leave the build command empty, publish directory `.` (this is
   already set in `netlify.toml`). Deploy.
4. Once live, you'll get a URL like `https://ina-portfolio.netlify.app`. You can
   add a custom domain later in Site settings → Domain management.

Netlify auto-detects the `<form name="inquiries" data-netlify="true">` in
`inquiries.html` the first time it deploys — no extra config needed for the
form itself to start capturing submissions.

## 2. Turn on email notifications (the "forward to your email" part)

In the Netlify dashboard: **Site settings → Forms → Form notifications →
Add notification → Email notification**. Point it at your inbox and select
the `inquiries` form. Every submission will land in your email automatically
— no code required for this part.

## 3. Turn on the GitHub issue logging

This is the part the function handles, but it needs two things set up in
Netlify first:

**a) Create a GitHub token**
1. GitHub → Settings → Developer settings → Personal access tokens →
   Fine-grained tokens → Generate new token.
2. Repository access: only `gerona-ina/ina-portfolio`.
3. Permissions: **Issues → Read and write**.
4. Generate and copy the token (you won't see it again).

**b) Add it to Netlify as an environment variable**
1. Site settings → Environment variables → Add a variable.
2. Key: `GITHUB_TOKEN`, value: the token you just copied.
3. Redeploy the site so the function picks it up.

**c) Wire the form submission to the function**
1. Site settings → Forms → Form notifications → Add notification →
   **Outgoing webhook**.
2. Event to listen for: `New form submission`.
3. URL to notify: `https://YOUR-SITE.netlify.app/.netlify/functions/inquiry-to-github`
   (swap in your real Netlify site URL).
4. Form: `inquiries`.

Once that's saved, every submission will:
1. Send you an email (step 2), and
2. Trigger the function, which opens a new GitHub Issue labeled `inquiry`
   in this repo with the name, contact info, subject, and message.

## Testing it

After deploying, go to `/inquiries.html` on the live Netlify URL (form
submissions only work on the deployed site, not when opening the HTML file
locally) and submit a test entry. Check your email and the repo's Issues tab.
