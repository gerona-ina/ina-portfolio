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
        link.textContent = title;

        card.appendChild(link);
        galleryGrid.appendChild(card);
    }
}

// for audioplayer 
if (entry.audioUrl) {
    attachAudioPlayer(card, entry.audioUrl);
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

        const entries = await getFiles(categories[category]);

        displayEntries(entries);

    } catch (error) {

        console.error(error);

        galleryGrid.innerHTML =
            `<p>Unable to load entries: ${error.message}</p>`;
    }
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