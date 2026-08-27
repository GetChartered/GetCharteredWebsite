// Browser-only (canvas/Image/FileReader) — never import this from a Server
// Component or Route Handler. Used by components/account/AvatarUpload.tsx to
// shrink a user-selected photo to a small square before it ever leaves the
// browser, so the upload payload stays tiny regardless of the source image's
// original size.

const OUTPUT_SIZE = 320;
const JPEG_QUALITY = 0.85;

export class ImageResizeError extends Error {}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new ImageResizeError("Couldn't read the selected file."));
    };
    reader.onerror = () => reject(new ImageResizeError("Couldn't read the selected file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ImageResizeError("That file doesn't look like a valid image."));
    img.src = src;
  });
}

/**
 * Reads a user-selected image file, center-crops it to a square, and
 * resizes it down to a fixed small avatar size — keeping the upload payload
 * small no matter how large the source photo is. Returns a JPEG data URL
 * ("data:image/jpeg;base64,...") ready to send straight to POST
 * /api/user/photo.
 */
export async function resizeImageToSquare(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new ImageResizeError("Please choose an image file.");
  }

  const dataUrl = await readFileAsDataUrl(file);
  const img = await loadImage(dataUrl);

  const sourceSize = Math.min(img.naturalWidth, img.naturalHeight);
  if (!sourceSize) {
    throw new ImageResizeError("That file doesn't look like a valid image.");
  }
  const sourceX = (img.naturalWidth - sourceSize) / 2;
  const sourceY = (img.naturalHeight - sourceSize) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new ImageResizeError("Your browser can't process images here.");
  }

  ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}
