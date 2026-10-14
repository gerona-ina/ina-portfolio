// ============================================================
// BUILD GALLERY
// Runs on Netlify every time you push (see netlify.toml).
// Scans projects/ and writing/ for .html pages — the same way
// gallery.js used to ask GitHub — and writes the results to
// gallery.json, which gallery.js then reads from your own site.
//
// Why: GitHub's API only allows 60 requests per hour per network.
// Reading gallery.json has no limit and loads faster.
//
// To test locally:  node scripts/build-gallery.js
// ============================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SECTIONS = ["projects", "writing"];

const IMAGE_FOLDER = "images";
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

const AUDIO_FOLDER = "audios";
const AUDIO_EXTENSIONS = [".mp3", ".m4a", ".wav"];

// "poem-01.m4a" -> "poem-01"
function getBaseName(filename) {
    return filename.replace(/\.[^/.]+$/, "");
}

// basename -> "/folder/file.ext" for every matching file in a top-level folder
function getFileMap(folder, extensions) {
    const map = {};
    const dir = path.join(ROOT, folder);
    if (!fs.existsSync(dir)) return map;

    for (const name of fs.readdirSync(dir)) {
        const isFile = fs.statSync(path.join(dir, name)).isFile();
        if (isFile && extensions.some(ext => name.toLowerCase().endsWith(ext))) {
            map[getBaseName(name)] = `/${folder}/${name}`;
        }
    }
    return map;
}

// Recursively find HTML files in a folder (skipping index.html).
function getFiles(relativeDir) {
    let files = [];
    for (const name of fs.readdirSync(path.join(ROOT, relativeDir))) {
        const relativePath = path.posix.join(relativeDir, name);
        const stat = fs.statSync(path.join(ROOT, relativePath));

        if (stat.isFile() && name.endsWith(".html") && name !== "index.html") {
            files.push(relativePath);
        } else if (stat.isDirectory()) {
            files = files.concat(getFiles(relativePath));
        }
    }
    return files;
}

// Pull a <meta name="..." content="..."> value out of a page.
function getMeta(html, name) {
    const pattern = new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, "i");
    const match = html.match(pattern);
    return match ? match[1].trim() : "";
}

function stripTags(text) {
    return text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

const images = getFileMap(IMAGE_FOLDER, IMAGE_EXTENSIONS);
const audios = getFileMap(AUDIO_FOLDER, AUDIO_EXTENSIONS);
const entries = [];

for (const section of SECTIONS) {
    if (!fs.existsSync(path.join(ROOT, section))) continue;

    for (const file of getFiles(section)) {
        const html = fs.readFileSync(path.join(ROOT, file), "utf8");
        const base = getBaseName(path.basename(file));

        // Same rule as before: the title is whatever is inside <h1>.
        const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
        const tags = getMeta(html, "gallery-tags");

        entries.push({
            path: file,                                   // e.g. "projects/technical/lens-mounts.html"
            title: titleMatch ? stripTags(titleMatch[1]) : base,
            summary: getMeta(html, "description"),
            tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
            order: Number(getMeta(html, "gallery-order")) || null,
            featured: getMeta(html, "gallery-featured") === "true",
            image: images[base] || null,
            audio: audios[base] || null
        });
    }
}

const output = { generated: new Date().toISOString(), entries };
fs.writeFileSync(path.join(ROOT, "gallery.json"), JSON.stringify(output, null, 2));

console.log(`gallery.json: ${entries.length} entries`);
