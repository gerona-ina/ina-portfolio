// ============================================================
// MISSING IMAGES
// Keeps pages clean while photos are still being added:
//  - The cover photo (class="case-hero") tries .jpg, then .png, then .webp,
//    so you can save covers in whichever format you have.
//  - Any other image that doesn't exist yet is hidden (with its caption),
//    instead of showing a broken-image icon.
// Once the file is added to /images, it shows up automatically.
// ============================================================

const COVER_EXTENSIONS = [".jpg", ".png", ".webp"];

function handleMissing(img) {

    // Cover photo: try the next file extension before giving up.
    if (img.classList.contains("case-hero")) {
        const tried = Number(img.dataset.tried || 0) + 1;
        if (tried < COVER_EXTENSIONS.length) {
            img.dataset.tried = tried;
            img.src = img.src.replace(/\.(jpg|png|webp)$/, COVER_EXTENSIONS[tried]);
            return;
        }
    }

    // Hide the image (or its whole <figure>), and an emptied side-by-side pair.
    const figure = img.closest("figure") || img;
    figure.hidden = true;

    const pair = figure.closest(".figure-pair");
    if (pair && [...pair.children].every(child => child.hidden)) {
        pair.hidden = true;
    }
}

document.querySelectorAll("img").forEach(img => {
    if (img.complete && img.naturalWidth === 0) {
        handleMissing(img);
    }
    img.addEventListener("error", () => handleMissing(img));
});
