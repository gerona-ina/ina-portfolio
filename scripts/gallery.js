// ============================================================
// 1. CONFIGURATION
// ============================================================

const owner = "gerona-ina";
const repo = "ina-portfolio";
const branch = "main";

// The list of entries is written to /gallery.json by scripts/build-gallery.js
// every time Netlify deploys. If it's missing (e.g. previewing locally without
// running the build), we fall back to asking the GitHub API like before.
const GALLERY_FILE = "/gallery.json";

const galleryGrid = document.querySelector(".gallery-grid");
const toggleButtons = document.querySelectorAll(".gallery-toggle");

// Load entries for the selected category, given its folder path.
async function selectCategory(path, category) {

    toggleButtons.forEach(button => {
        button.classList.toggle("active", button.dataset.category === category);
    });

    galleryGrid.innerHTML = '<p class="gallery-status">Loading…</p>';

    try {

        const allEntries = await getEntries();

        let entries = allEntries.filter(entry => entry.path.startsWith(path + "/"));

        // Home page: only show projects marked <meta name="gallery-featured" content="true">
        if (galleryGrid.dataset.featured !== undefined) {
            entries = entries.filter(entry => entry.featured);
        }

        displayEntries(entries);

    } catch (error) {

        console.error(error);
        galleryGrid.innerHTML = `<p class="gallery-status">Unable to load entries: ${error.message}</p>`;
    }
}

// ============================================================
// 2. FIND ENTRIES
// ============================================================

let entriesPromise = null;

// Fetch the entry list once per page, no matter how many times a toggle is clicked.
function getEntries() {
    if (!entriesPromise) {
        entriesPromise = loadGalleryFile().catch(error => {
            console.warn("gallery.json not available, asking GitHub instead.", error);
            return loadFromGitHub();
        });
    }
    return entriesPromise;
}

async function loadGalleryFile() {
    const response = await fetch(GALLERY_FILE, { cache: "no-cache" });
    if (!response.ok) {
        throw new Error(`gallery.json: ${response.status}`);
    }
    const data = await response.json();
    return data.entries;
}

// ---------- Fallback: the original GitHub API approach ----------

const IMAGE_FOLDER = "images";
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const AUDIO_FOLDER = "audios";
const AUDIO_EXTENSIONS = [".mp3", ".m4a", ".wav"];

// Strips the extension off a filename, e.g. "poem-01.wav" -> "poem-01".
function getBaseName(filename) {
    return filename.replace(/\.[^/.]+$/, "");
}

async function githubContents(path) {
    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
    );
    if (!response.ok) {
        throw new Error(`Could not load ${path}: ${response.status}`);
    }
    return response.json();
}

// basename -> download URL for every matching file in a top-level folder.
async function getFileMap(folder, extensions) {
    try {
        const items = await githubContents(folder);
        const map = {};
        for (const item of items) {
            if (item.type === "file" && extensions.some(ext => item.name.endsWith(ext))) {
                map[getBaseName(item.name)] = item.download_url;
            }
        }
        return map;
    } catch {
        return {};
    }
}

// Recursively find HTML files in a folder.
async function getFiles(path) {
    const items = await githubContents(path);
    let files = [];
    for (const item of items) {
        if (item.type === "file" && item.name.endsWith(".html") && item.name !== "index.html") {
            files.push(item);
        } else if (item.type === "dir") {
            files = files.concat(await getFiles(item.path));
        }
    }
    return files;
}

function readMeta(html, name) {
    const match = html.match(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"`, "i"));
    return match ? match[1].trim() : "";
}

async function loadFromGitHub() {
    const section = galleryGrid.dataset.path || document.querySelector(".gallery-toggle")?.dataset.path.split("/")[0];

    const [files, audioMap, imageMap] = await Promise.all([
        getFiles(section),
        getFileMap(AUDIO_FOLDER, AUDIO_EXTENSIONS),
        getFileMap(IMAGE_FOLDER, IMAGE_EXTENSIONS)
    ]);

    return Promise.all(files.map(async file => {
        const html = await (await fetch(file.download_url)).text();
        const title = html.match(/<h1[^>]*>(.*?)<\/h1>/s);
        const tags = readMeta(html, "gallery-tags");
        const base = getBaseName(file.name);

        return {
            path: file.path,
            title: title ? title[1].replace(/<[^>]+>/g, "").trim() : file.name,
            summary: readMeta(html, "description"),
            tags: tags ? tags.split(",").map(t => t.trim()) : [],
            order: Number(readMeta(html, "gallery-order")) || null,
            featured: readMeta(html, "gallery-featured") === "true",
            image: imageMap[base] || null,
            audio: audioMap[base] || null
        };
    }));
}

// ============================================================
// 3. DISPLAY ENTRIES
// ============================================================

// Sort by gallery-order if a page sets one, otherwise by the number in the
// title (e.g. "poem 01: ..." -> 1), otherwise alphabetically.
function compareEntries(a, b) {
    const rank = entry => entry.order ?? parseInt(entry.title.match(/\d+/)) ?? Infinity;
    const rankA = rank(a), rankB = rank(b);
    const numA = Number.isNaN(rankA) ? Infinity : rankA;
    const numB = Number.isNaN(rankB) ? Infinity : rankB;
    return numA - numB || a.title.localeCompare(b.title);
}

// Turn entries into gallery cards.
function displayEntries(entries) {

    galleryGrid.innerHTML = "";

    if (entries.length === 0) {
        galleryGrid.innerHTML = '<p class="gallery-status">No entries yet.</p>';
        return;
    }

    for (const entry of [...entries].sort(compareEntries)) {

        const card = document.createElement("article");
        card.classList.add("gallery-entry");

        const link = document.createElement("a");
        link.href = "/" + entry.path;
        link.classList.add("entry-link");

        // Thumbnail: images/<same-name-as-page>.jpg|png|webp
        // No image yet? Show a clean tile with the first tag instead.
        if (entry.image) {
            const image = document.createElement("img");
            image.src = entry.image;
            image.alt = "";
            image.loading = "lazy";
            image.classList.add("entry-thumbnail");
            link.appendChild(image);
        } else if (entry.tags.length) {
            const tile = document.createElement("div");
            tile.classList.add("entry-thumbnail", "entry-tile");
            tile.textContent = entry.tags[0];
            link.appendChild(tile);
        }

        const body = document.createElement("div");
        body.classList.add("entry-body");

        if (entry.tags.length) {
            const tagRow = document.createElement("div");
            tagRow.classList.add("entry-tags");
            for (const tag of entry.tags) {
                const tagEl = document.createElement("span");
                tagEl.classList.add("tag");
                if (/^completed$/i.test(tag)) tagEl.classList.add("status-done");
                if (/^in progress$/i.test(tag)) tagEl.classList.add("status-wip");
                tagEl.textContent = tag;
                tagRow.appendChild(tagEl);
            }
            body.appendChild(tagRow);
        }

        const titleText = document.createElement("span");
        titleText.textContent = entry.title;
        titleText.classList.add("entry-title");
        body.appendChild(titleText);

        if (entry.summary) {
            const summary = document.createElement("p");
            summary.textContent = entry.summary;
            summary.classList.add("entry-summary");
            body.appendChild(summary);
        }

        link.appendChild(body);
        card.appendChild(link);

        if (entry.audio) {
            attachAudioPlayer(card, entry.audio);
        }

        galleryGrid.appendChild(card);
    }
}

// ============================================================
// 4. INITIALIZE
// ============================================================

toggleButtons.forEach(button => {
    button.addEventListener("click", () => {
        selectCategory(button.dataset.path, button.dataset.category);
    });
});

// Load whichever category is marked active by default in the HTML,
// or (on pages without toggles, like the home page) the grid's own data-path.
const defaultButton = document.querySelector(".gallery-toggle.active");
if (defaultButton) {
    selectCategory(defaultButton.dataset.path, defaultButton.dataset.category);
} else if (galleryGrid && galleryGrid.dataset.path) {
    selectCategory(galleryGrid.dataset.path, null);
}
