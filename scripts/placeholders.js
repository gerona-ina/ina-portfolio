// ============================================================
// IMAGE PLACEHOLDERS + FORMAT FALLBACK
// The HTML points at a file like images/projects/mach120/cover.png.
// If that exact file isn't there, we try the same name with the other
// common formats (.webp, .png, .jpg, .jpeg) before giving up. So it
// doesn't matter if Notion hands you a .webp: drop it in with the right
// name and the page finds it.
// If no format exists yet, show a striped box with the expected path.
// ============================================================

const IMAGE_FORMATS = [".png", ".jpg", ".jpeg", ".webp"];

function showPlaceholder(img) {
    if (img.dataset.ph) return;
    img.dataset.ph = "1";

    const box = document.createElement("div");
    box.className = "img-ph " + img.className;
    // Show the originally expected path, not whichever format we tried last.
    box.textContent = "add photo: " + (img.dataset.origSrc || img.getAttribute("src")).replace(/^(\.\.\/)+/, "");
    img.replaceWith(box);
}

function handleMissing(img) {
    if (img.dataset.ph) return;

    const current = img.getAttribute("src");
    if (!img.dataset.origSrc) {
        img.dataset.origSrc = current;
        img.dataset.tried = "";
    }

    const base = img.dataset.origSrc.replace(/\.[^/.]+$/, "");
    const tried = img.dataset.tried ? img.dataset.tried.split(",") : [];
    const origExt = (img.dataset.origSrc.match(/\.[^/.]+$/) || [""])[0].toLowerCase();
    tried.push(origExt);

    // Next format we haven't tried yet.
    const stillToTry = IMAGE_FORMATS.filter(ext => !tried.includes(ext));

    const candidate = stillToTry[0];
    if (!candidate) {
        showPlaceholder(img);
        return;
    }

    img.dataset.tried = tried.concat(candidate).join(",");
    img.src = base + candidate;
}

document.querySelectorAll("img").forEach(img => {
    img.addEventListener("error", () => handleMissing(img));
    // Image may have already failed before this script ran.
    if (img.complete && img.naturalWidth === 0) {
        handleMissing(img);
    }
});
