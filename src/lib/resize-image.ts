import "server-only";
import sharp from "sharp";

// Longest edge we keep for avatars / logos. These images render at ~40–200px
// on screen, so 512px is plenty sharp on retina while keeping files tiny.
const MAX_DIM = 512;

// Formats sharp can't rasterize (vector / document). We store these as-is.
const PASSTHROUGH_MIME = new Set(["image/svg+xml", "application/pdf"]);

/**
 * Shrink an uploaded image down to a sane on-screen size and re-compress it,
 * so a 16 MB phone photo doesn't get stored (and re-downloaded on every page)
 * at full resolution. Keeps aspect ratio, never enlarges, and honors EXIF
 * rotation. SVG/PDF pass through untouched. If sharp can't process the buffer
 * for any reason, we return the original so the upload still succeeds.
 */
export async function resizeImage(input: Buffer, mime: string): Promise<Buffer> {
  if (PASSTHROUGH_MIME.has(mime)) return input;

  try {
    let pipeline = sharp(input, { failOn: "none" })
      .rotate() // bake in EXIF orientation before we strip metadata
      .resize({
        width: MAX_DIM,
        height: MAX_DIM,
        fit: "inside",
        withoutEnlargement: true,
      });

    if (mime === "image/png") {
      pipeline = pipeline.png({ compressionLevel: 9 });
    } else if (mime === "image/webp") {
      pipeline = pipeline.webp({ quality: 82 });
    } else if (mime === "image/gif") {
      // Preserve animation if present; sharp needs `animated` to keep frames.
      pipeline = sharp(input, { failOn: "none", animated: true })
        .resize({
          width: MAX_DIM,
          height: MAX_DIM,
          fit: "inside",
          withoutEnlargement: true,
        })
        .gif();
    } else {
      // Default (jpeg and anything else raster) → compact progressive JPEG.
      pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
    }

    return await pipeline.toBuffer();
  } catch {
    // Never lose the upload over a resize hiccup — fall back to the original.
    return input;
  }
}
