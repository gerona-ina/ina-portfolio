// ============================================================
// IMAGE PLACEHOLDERS
// If a photo hasn't been added to /images yet, show a striped
// box with the expected file path instead of a broken image.
// Once the file exists, the real image shows automatically.
// ============================================================

function showPlaceholder(img) {
    if (img.dataset.ph) return;
    img.dataset.ph = "1";

    const box = document.createElement("div");
    box.className = "img-ph " + img.className;
    box.textContent = "add photo: " + img.getAttribute("src").replace(/^(\.\.\/)+/, "");
    img.replaceWith(box);
}

document.querySelectorAll("img").forEach(img => {
    if (img.complete && img.naturalWidth === 0) {
        showPlaceholder(img);
    } else {
        img.addEventListener("error", () => showPlaceholder(img));
    }
});
