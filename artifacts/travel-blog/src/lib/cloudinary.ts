import type { GalleryImage, MediaAsset } from "@/lib/travel-types";

type ImageTransformOptions = {
  width?: number;
  height?: number;
  quality?: string | number;
  crop?: string;
};

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
const defaultTransforms = "f_auto,q_auto";

function joinTransforms(options: ImageTransformOptions = {}): string {
  const transforms = [defaultTransforms];

  if (options.crop) transforms.push(`c_${options.crop}`);
  if (options.width) transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  if (options.quality) transforms.push(`q_${options.quality}`);

  return transforms.join(",");
}

export function buildCloudinaryImageUrl(
  publicId: string,
  options?: ImageTransformOptions,
): string | null {
  if (!cloudName || !publicId) return null;
  return `https://res.cloudinary.com/${cloudName}/image/upload/${joinTransforms(options)}/${publicId}`;
}

export function getMediaAssetImageUrl(
  asset: MediaAsset | null | undefined,
  options?: ImageTransformOptions,
): string | null {
  if (!asset) return null;
  return (
    buildCloudinaryImageUrl(asset.publicId, options) ??
    asset.deliveryUrl ??
    null
  );
}

export function getGalleryImageUrl(
  image: GalleryImage | null | undefined,
  options?: ImageTransformOptions,
): string | null {
  if (!image) return null;
  return (
    (image.publicId ? buildCloudinaryImageUrl(image.publicId, options) : null) ??
    image.url ??
    null
  );
}
