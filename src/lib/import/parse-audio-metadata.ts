/**
 * Extract metadata from audio file using music-metadata
 * This runs client-side in the browser
 */

import * as musicMetadata from "music-metadata";

export interface AudioMetadata {
  artist: string | null;
  copyright: string | null;
  sourceUrl: string | null;
  comment: string | null;
  embeddedImage: {
    data: Uint8Array;
    mimeType: string;
  } | null;
}

export async function parseAudioMetadata(file: File): Promise<AudioMetadata> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const metadata = await musicMetadata.parseBuffer(uint8Array, {
      mimeType: file.type || "audio/mpeg",
    });

    const common = metadata.common;
    const native = metadata.native;

    // Extract artist (TPE1)
    const artist = common.artist || null;

    // Extract copyright (WCOP or TCOP)
    let copyright = common.copyright || null;

    // Extract URL (WOAF or WXXX)
    let sourceUrl: string | null = null;

    // Try to find URLs in native tags
    if (native) {
      for (const format of Object.values(native)) {
        for (const tag of format) {
          if (tag.id === "WOAF" || tag.id === "WXXX") {
            if (typeof tag.value === "string") {
              sourceUrl = tag.value;
            } else if (tag.value && typeof tag.value === "object" && "url" in tag.value) {
              sourceUrl = (tag.value as { url: string }).url;
            }
          }
          if (tag.id === "WCOP" && !copyright) {
            copyright = typeof tag.value === "string" ? tag.value : null;
          }
        }
      }
    }

    // Fix URL if it starts with // (relative protocol)
    if (sourceUrl && sourceUrl.startsWith("//")) {
      sourceUrl = "https:" + sourceUrl;
    }

    // Extract comment (COMM)
    const rawComment = common.comment?.[0];
    const comment = typeof rawComment === "string" ? rawComment : (rawComment?.text || null);

    // Extract embedded image (APIC)
    let embeddedImage: AudioMetadata["embeddedImage"] = null;
    if (common.picture && common.picture.length > 0) {
      const pic = common.picture[0];
      embeddedImage = {
        data: pic.data,
        mimeType: pic.format,
      };
    }

    return {
      artist,
      copyright,
      sourceUrl,
      comment,
      embeddedImage,
    };
  } catch (error) {
    console.error("Error parsing audio metadata:", error);
    return {
      artist: null,
      copyright: null,
      sourceUrl: null,
      comment: null,
      embeddedImage: null,
    };
  }
}

/**
 * Convert embedded image data to a File object for upload
 */
export function embeddedImageToFile(
  image: NonNullable<AudioMetadata["embeddedImage"]>,
  filename: string
): File {
  const extension = image.mimeType.split("/")[1] || "jpg";
  // Create a new Uint8Array copy to ensure ArrayBuffer compatibility
  const uint8Copy = new Uint8Array(image.data);
  const blob = new Blob([uint8Copy.buffer as ArrayBuffer], { type: image.mimeType });
  return new File([blob], `${filename}.${extension}`, { type: image.mimeType });
}
