# Project photos

Photos appear on the site automatically once you add them with the names below and push.
Until then, cards show a plain category tile and missing photos are simply hidden on project pages.

To get the originals from Notion, open each project page, right-click each image, and choose **Download**.

## Cover photos (gallery card + top of the project page)

These go in the main `images/` folder, named exactly like the project page.
Use `.jpg`, `.png`, or `.webp`.

| File | Notion image |
|---|---|
| `images/lens-mounts.jpg` | Gallery cover (IMG_9372.jpeg) |
| `images/quincke-tube.png` | Gallery cover |
| `images/tripod-adapter.png` | Gallery cover |
| `images/hv-enclosure.png` | Gallery cover (IMG_9393.png) |
| `images/mach120.png` | Gallery cover (IMG_9397.png) |
| `images/track-car.png` | 1st image on the page |

## Photos inside each project page

These go in `images/projects/<project>/`. The "Notion image" column follows the order the images appear on each Notion page.

| Folder | File | Notion image |
|---|---|---|
| `lens-mounts/` | `design.png` | 1st image (under Approach) |
| | `result.png` | 2nd image (under Result) |
| `quincke-tube/` | `foam-test.jpg` | 1st image (IMG_9387.jpeg) |
| | `horn-concept.png` | 2nd image (under Future Improvement) |
| `tripod-adapter/` | `proto-1.png` | 1st image |
| | `proto-2a.png`, `proto-2b.png` | 2nd and 3rd images |
| | `result-1.png`, `result-2.png` | 4th and 5th images |
| `mach120/` | `photo-1.png` | IMG_9396.png |
| `track-car/` | `photo-2.png` … `photo-5.png` | 2nd–5th images |

**Tip:** keep each photo under ~500 KB (about 1600px wide) so pages load quickly on phones.
If a detail photo's extension differs (e.g. `.jpg` instead of `.png`), rename the file or update its `src` in the page.
