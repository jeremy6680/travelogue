import type { CreateMediaAssetBody, GalleryImage, MediaAsset } from "@/lib/travel-types";

type ImageTransformOptions = {
  width?: number;
  height?: number;
  quality?: string | number;
  crop?: string;
};

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME?.trim();
const directusBaseUrl = (import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:8055").replace(/\/$/, "");
const defaultTransforms = "f_auto,q_auto";
export const CLOUDINARY_UPLOAD_FOLDERS = [
  "travelogue/posts",
  "travelogue/trips",
  "travelogue/home/featured",
] as const;

type CloudinaryUploadFolder = (typeof CLOUDINARY_UPLOAD_FOLDERS)[number];

type SignedUploadPayload = {
  assetFolder: CloudinaryUploadFolder;
  publicId?: string | null;
};

type SignedUploadResponse = {
  apiKey: string;
  assetFolder: CloudinaryUploadFolder;
  cloudName: string;
  publicId: string | null;
  signature: string;
  timestamp: number;
};

type CloudinaryUploadOptions = {
  adminToken: string;
  assetFolder: CloudinaryUploadFolder;
  file: File;
  publicId?: string | null;
  title?: string | null;
  alt?: string | null;
  caption?: string | null;
};

type CloudinaryUploadResult = {
  mediaAsset: CreateMediaAssetBody;
  upload: {
    secureUrl: string | null;
    publicId: string;
  };
};

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

async function signCloudinaryUpload(
  adminToken: string,
  payload: SignedUploadPayload,
): Promise<SignedUploadResponse> {
  const response = await fetch(`${directusBaseUrl}/cloudinary-upload/sign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Cloudinary signing failed with status ${response.status}`);
  }

  const body = await response.json();
  return body.data as SignedUploadResponse;
}

export async function uploadImageToCloudinary(
  options: CloudinaryUploadOptions,
): Promise<CloudinaryUploadResult> {
  const signature = await signCloudinaryUpload(options.adminToken, {
    assetFolder: options.assetFolder,
    publicId: options.publicId,
  });

  const uploadForm = new FormData();
  uploadForm.append("file", options.file);
  uploadForm.append("api_key", signature.apiKey);
  uploadForm.append("asset_folder", signature.assetFolder);
  uploadForm.append("signature", signature.signature);
  uploadForm.append("timestamp", String(signature.timestamp));

  if (signature.publicId) {
    uploadForm.append("public_id", signature.publicId);
  }

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    {
      method: "POST",
      body: uploadForm,
    },
  );

  if (!uploadResponse.ok) {
    throw new Error(`Cloudinary upload failed with status ${uploadResponse.status}`);
  }

  const uploaded = (await uploadResponse.json()) as {
    bytes?: number;
    format?: string;
    height?: number;
    public_id: string;
    resource_type?: string;
    secure_url?: string;
    width?: number;
  };

  return {
    mediaAsset: {
      alt: options.alt ?? null,
      bytes: uploaded.bytes ?? null,
      caption: options.caption ?? null,
      deliveryUrl: uploaded.secure_url ?? null,
      folder: signature.assetFolder,
      format: uploaded.format ?? null,
      height: uploaded.height ?? null,
      placeholderUrl: null,
      publicId: uploaded.public_id,
      resourceType: uploaded.resource_type ?? "image",
      title: options.title ?? null,
      width: uploaded.width ?? null,
    },
    upload: {
      publicId: uploaded.public_id,
      secureUrl: uploaded.secure_url ?? null,
    },
  };
}
