import crypto from "node:crypto";

const ALLOWED_FOLDERS = new Set([
  "travelogue/posts",
  "travelogue/trips",
  "travelogue/home/featured",
]);

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are missing");
  }

  return { cloudName, apiKey, apiSecret };
}

function signUploadParameters(parameters, apiSecret) {
  const signatureBase = Object.entries(parameters)
    .filter(([, value]) => value != null && String(value).trim() !== "")
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return crypto.createHash("sha1").update(`${signatureBase}${apiSecret}`).digest("hex");
}

export default {
  id: "cloudinary-upload",
  handler: (router) => {
    router.get("/", (req, res) => {
      res.json({ data: { allowedFolders: [...ALLOWED_FOLDERS] } });
    });

    router.post("/sign", async (req, res, next) => {
      try {
        const isAuthenticated = Boolean(
          req.accountability && (req.accountability.user || req.accountability.admin),
        );

        if (!isAuthenticated) {
          res.status(401).json({ error: "Authentication required" });
          return;
        }

        const assetFolder = String(req.body?.assetFolder ?? "").trim();
        const publicId = String(req.body?.publicId ?? "").trim();

        if (!ALLOWED_FOLDERS.has(assetFolder)) {
          res.status(400).json({ error: "Invalid Cloudinary folder" });
          return;
        }

        const timestamp = Math.floor(Date.now() / 1000);
        const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
        const signingParameters = {
          asset_folder: assetFolder,
          public_id: publicId || undefined,
          timestamp,
        };

        const signature = signUploadParameters(signingParameters, apiSecret);

        res.json({
          data: {
            apiKey,
            assetFolder,
            cloudName,
            publicId: publicId || null,
            signature,
            timestamp,
          },
        });
      } catch (error) {
        next(error);
      }
    });
  },
};
