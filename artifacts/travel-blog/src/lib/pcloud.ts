import { useQuery } from "@tanstack/react-query";

export type PCloudImage = {
  id: number;
  name: string;
  contentType: string | null;
  thumbUrl: string;
  previewUrl: string;
};

type PCloudMetadata = {
  fileid?: number;
  isfolder?: boolean;
  name?: string;
  icon?: string;
  thumb?: boolean;
  contenttype?: string;
  contents?: PCloudMetadata[];
};

type PCloudShowPublinkResponse = {
  result: number;
  metadata?: PCloudMetadata;
  error?: string;
};

const PCLOUD_IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "bmp",
  "avif",
  "heic",
  "heif",
  "tif",
  "tiff",
]);

export function parsePCloudPublicCode(value: string | null | undefined) {
  if (!value) return null;

  try {
    const parsedUrl = new URL(value);
    const code = parsedUrl.searchParams.get("code") ?? parsedUrl.searchParams.get("shortcode");
    return code?.trim() || null;
  } catch {
    return value.trim() || null;
  }
}

function getPCloudApiBase(publicLink: string) {
  try {
    const parsedUrl = new URL(publicLink);
    const subdomain = parsedUrl.hostname.split(".")[0];

    if (subdomain && subdomain !== "www") {
      return `https://${subdomain}api.pcloud.com`;
    }
  } catch {
    // Ignore parsing errors and use the default endpoint below.
  }

  return "https://api.pcloud.com";
}

function getExtension(filename: string) {
  const parts = filename.toLowerCase().split(".");
  return parts.length > 1 ? parts.at(-1) ?? "" : "";
}

function isImageFile(file: PCloudMetadata) {
  if (file.isfolder || !file.fileid) return false;

  const contentType = file.contenttype?.toLowerCase() ?? "";
  if (contentType.startsWith("image/")) return true;
  if (file.icon === "image") return true;

  const extension = getExtension(file.name ?? "");
  return PCLOUD_IMAGE_EXTENSIONS.has(extension);
}

function flattenImages(metadata: PCloudMetadata | undefined): PCloudMetadata[] {
  if (!metadata) return [];

  if (!metadata.isfolder) {
    return isImageFile(metadata) ? [metadata] : [];
  }

  return (metadata.contents ?? []).flatMap((entry) => flattenImages(entry));
}

function buildPCloudThumbUrl(apiBase: string, code: string, fileId: number, size: string) {
  const params = new URLSearchParams({
    code,
    fileid: String(fileId),
    size,
    crop: "1",
  });

  return `${apiBase}/getpubthumb?${params.toString()}`;
}

async function fetchPCloudPublicImages(publicLink: string) {
  const code = parsePCloudPublicCode(publicLink);
  const apiBase = getPCloudApiBase(publicLink);

  if (!code) {
    throw new Error("Invalid pCloud public link.");
  }

  const endpoint = new URL(`${apiBase}/showpublink`);
  endpoint.searchParams.set("code", code);

  const response = await fetch(endpoint.toString());
  if (!response.ok) {
    throw new Error(`pCloud request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as PCloudShowPublinkResponse;
  if (payload.result !== 0) {
    throw new Error(payload.error || "Unable to load pCloud gallery.");
  }

  return flattenImages(payload.metadata)
    .filter((entry): entry is PCloudMetadata & { fileid: number } => typeof entry.fileid === "number")
    .toSorted((left, right) =>
      (left.name ?? "").localeCompare(right.name ?? "", "fr", { numeric: true, sensitivity: "base" }),
    )
    .map((entry) => ({
      id: entry.fileid,
      name: entry.name ?? `Image ${entry.fileid}`,
      contentType: entry.contenttype ?? null,
      thumbUrl: buildPCloudThumbUrl(apiBase, code, entry.fileid, "640x640"),
      previewUrl: buildPCloudThumbUrl(apiBase, code, entry.fileid, "1600x1000"),
    }));
}

export function usePCloudPublicGallery(publicLink: string | null | undefined) {
  return useQuery({
    queryKey: ["pcloud", "publink-gallery", publicLink],
    queryFn: () => fetchPCloudPublicImages(publicLink ?? ""),
    enabled: Boolean(publicLink && parsePCloudPublicCode(publicLink)),
    staleTime: 1000 * 60 * 30,
  });
}
