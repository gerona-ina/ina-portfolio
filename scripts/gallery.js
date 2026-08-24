const owner = "gerona-ina";
const repo = "ina-portfolio";
const branch = "main";

const galleryGrid = document.querySelector(".gallery-grid");
const toggleButtons = document.querySelectorAll(".gallery-toggle");

const categories = {
    technical: "writing/technical",
    personal: "writing/personal"
};

// parse folder
async function getFiles(path) {
    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
    );

    if (!response.ok) {
        throw new Error(`Could not load ${path}`);
    }

    const items = await response.json();

    let files = [];

    for (const item of items) {

        if (item.type === "file" && item.name.endsWith(".html")) {
            if (item.name !== "index.html") {
                files.push(item);
            }
        }

        if (item.type === "dir") {
            const subdirectoryFiles = await getFiles(item.path);
            files = files.concat(subdirectoryFiles);
        }
    }

    return files;
}

// figure out whenever each entry was modified
async function getModifiedDate(path) {
    const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(path)}&per_page=1`
    );

    if (!response.ok) {
        throw new Error(`Could not get commit history for ${path}`);
    }

    const commits = await response.json();

    if (commits.length === 0) {
        return null;
    }

    return new Date(commits[0].commit.committer.date);
}

// cards
async function createEntries(category) {

    const files = await getFiles(categories[category]);

    const entries = await Promise.all(
        files.map(async file => {

            const modified = await getModifiedDate(file.path);

            return {
                name: file.name,
                path: file.path,
                modified: modified
            };
        })
    );

    entries.sort((a, b) => {
        return a.modified - b.modified;
    });

    return entries;
}

// put the cards onto the page
function displayEntries(entries) {

    galleryGrid.innerHTML = "";

    for (const entry of entries) {

        const card = document.createElement("article");
        card.classList.add("gallery-entry");

        const link = document.createElement("a");

        const relativePath = entry.path.replace("writing/", "");

        link.href = relativePath;

        link.textContent = entry.name;

        card.appendChild(link);
        galleryGrid.appendChild(card);
    }
}

// connect buttons
async function selectCategory(category) {

    toggleButtons.forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.category === category
        );
    });

    galleryGrid.innerHTML = "<p>Loading...</p>";

    try {
        const entries = await createEntries(category);
        displayEntries(entries);
    } catch (error) {
        console.error(error);
        galleryGrid.innerHTML =
            "<p>Unable to load entries.</p>";
    }
}

// technical loads by default
selectCategory("technical");