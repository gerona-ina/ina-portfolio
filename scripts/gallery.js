// ============================================================
// 1. CONFIGURATION
// ============================================================

const owner = "gerona-ina";
const repo = "ina-portfolio";
const branch = "main";

const galleryGrid = document.querySelector(".gallery-grid");
const toggleButtons = document.querySelectorAll(".gallery-toggle");

const categories = {
    technical: "writing/technical",
    personal: "writing/personal"
};

const AUDIO_FOLDER = "audios";
const AUDIO_EXTENSIONS = [".mp3", ".m4a", ".wav"];

// Strips the extension off a filename, e.g. "poem-01.wav" -> "poem-01".
function getBaseName(filename) {
    return filename.replace(/\.[^/.]+$/, "");
}

const IMAGE_FOLDER = "images";
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

// Same idea as getAudioMap, but for thumbnail images.
async function getImageMap() {

    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${IMAGE_FOLDER}?ref=${branch}`
    );

    if (!response.ok) {
        return {};
    }

    const items = await response.json();
    const map = {};

    for (const item of items) {
        if (item.type === "file" && IMAGE_EXTENSIONS.some(ext => item.name.endsWith(ext))) {
            map[getBaseName(item.name)] = item.download_url;
        }
    }

    return map;
}

// ============================================================
// 2. FIND ENTRIES
// ============================================================

// Recursively find HTML files in a category folder.
async function getFiles(path) {

    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
    );

    if (!response.ok) {
        throw new Error(
            `Could not load ${path}: ${response.status}`
        );
    }

    const items = await response.json();

    let files = [];

    for (const item of items) {

        // Add HTML files to the gallery.
        if (item.type === "file" && item.name.endsWith(".html")) {

            if (item.name !== "index.html") {
                files.push(item);
            }
        }

        // Search inside subfolders.
        else if (item.type === "dir") {

            const subdirectoryFiles = await getFiles(item.path);

            files = files.concat(subdirectoryFiles);
        }
    }

    return files;
}

// Builds a lookup of basename -> audio URL from the top-level audios/ folder.
async function getAudioMap() {

    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${AUDIO_FOLDER}?ref=${branch}`
    );

    if (!response.ok) {
        return {};
    }

    const items = await response.json();
    const map = {};

    for (const item of items) {
        if (item.type === "file" && AUDIO_EXTENSIONS.some(ext => item.name.endsWith(ext))) {
            map[getBaseName(item.name)] = item.download_url;
        }
    }

    return map;
}

// ============================================================
// 3. DISPLAY ENTRIES
// ============================================================

// Fetch a single entry's raw HTML and pull the title out of its <h1>.
async function getTitle(entry) {

    try {

        const response = await fetch(entry.download_url);
        const html = await response.text();

        // Grabs whatever is between <h1> and </h1>.
        const match = html.match(/<h1>(.*?)<\/h1>/s);

        return match ? match[1].trim() : entry.name;

    } catch (error) {

        console.error(`Could not read title for ${entry.name}`, error);

        // Fall back to the filename if something goes wrong.
        return entry.name;
    }
}

// Turn discovered files into gallery cards.
async function displayEntries(entries) {

    galleryGrid.innerHTML = "";

    if (entries.length === 0) {
        galleryGrid.innerHTML = "<p>No entries yet.</p>";
        return;
    }

    const titles = await Promise.all(entries.map(getTitle));

    // Pair each entry with its title so they can be sorted together.
    let pairs = entries.map((entry, i) => ({ entry, title: titles[i] }));

    // Sort by the number found in the title (e.g. "poem 01: ..." -> 1).
    pairs.sort((a, b) => {
        const numA = parseInt(a.title.match(/\d+/));
        const numB = parseInt(b.title.match(/\d+/));
        return numA - numB;
    });

        for (const { entry, title } of pairs) {

        const card = document.createElement("article");
        card.classList.add("gallery-entry");

        const link = document.createElement("a");
        link.href = "../" + entry.path;
        link.classList.add("entry-link");

        if (entry.imageUrl) {
            const image = document.createElement("img");
            image.src = entry.imageUrl;
            image.alt = title;
            image.classList.add("entry-thumbnail");
            link.appendChild(image);
        }

        const titleText = document.createElement("span");
        titleText.textContent = title;
        titleText.classList.add("entry-title");
        link.appendChild(titleText);

        card.appendChild(link);

        if (entry.audioUrl) {
            attachAudioPlayer(card, entry.audioUrl);
        }

        galleryGrid.appendChild(card);
    }
}



// ============================================================
// 4. CATEGORY TOGGLE
// ============================================================

// Load entries for the selected category.
async function selectCategory(category) {

    toggleButtons.forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.category === category
        );

    });

    galleryGrid.innerHTML = "<p>Loading...</p>";

    try {

        const [entries, audioMap] = await Promise.all([
            getFiles(categories[category]),
            getAudioMap()
        ]);

        for (const entry of entries) {
            entry.audioUrl = audioMap[getBaseName(entry.name)] || null;
        }

        await displayEntries(entries);

    } catch (error) {

        console.error(error);

        galleryGrid.innerHTML =
            `<p>Unable to load entries: ${error.message}</p>`;
    }
            const [entries, audioMap, imageMap] = await Promise.all([
            getFiles(categories[category]),
            getAudioMap(),
            getImageMap()
        ]);

        for (const entry of entries) {
            entry.audioUrl = audioMap[getBaseName(entry.name)] || null;
            entry.imageUrl = imageMap[getBaseName(entry.name)] || null;
        }

        await displayEntries(entries);

}


// ============================================================
// 5. INITIALIZE
// ============================================================

toggleButtons.forEach(button => {

    button.addEventListener("click", () => {
        selectCategory(button.dataset.category);
    });

});

// Technical is the default category.
selectCategory("technical");