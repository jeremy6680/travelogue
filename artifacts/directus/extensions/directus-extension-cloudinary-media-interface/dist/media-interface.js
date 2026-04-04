import { computed, h, ref, watch } from "vue";
import { useApi } from "@directus/extensions-sdk";

const DEFAULT_FOLDERS = [
  "travelogue/posts",
  "travelogue/trips",
  "travelogue/home/featured",
];

function createPreviewUrl(publicId, deliveryUrl) {
  if (deliveryUrl) return deliveryUrl;
  return null;
}

function stripFileExtension(filename) {
  return String(filename ?? "").replace(/\.[^.]+$/, "");
}

export default {
  props: {
    value: {
      type: String,
      default: "",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["input", "setFieldValue"],
  setup(props, { emit }) {
    const api = useApi();
    const wrapperRef = ref(null);
    const fileInputRef = ref(null);
    const publicIdValue = ref(props.value ?? "");
    const customPublicId = ref("");
    const selectedFolder = ref(DEFAULT_FOLDERS[0]);
    const previewUrl = ref(null);
    const isUploading = ref(false);
    const status = ref("");
    const statusTone = ref("neutral");

    watch(
      () => props.value,
      (value) => {
        publicIdValue.value = value ?? "";
      },
      { immediate: true },
    );

    const statusClass = computed(() => {
      if (statusTone.value === "success") return "color: var(--theme--success);";
      if (statusTone.value === "error") return "color: var(--theme--danger);";
      return "color: var(--theme--foreground-subdued);";
    });

    const buttonStyle =
      "display:inline-flex; align-items:center; justify-content:center; gap:8px; min-height:40px; padding:0 14px; border:1px solid var(--theme--primary); border-radius:var(--theme--border-radius); background:var(--theme--primary); color:var(--theme--primary-subdued); font-weight:600; cursor:pointer;";

    const fieldStyle =
      "width:100%; border:1px solid var(--theme--border-normal); border-radius:var(--theme--border-radius); background:var(--theme--background-page); color:var(--theme--foreground-normal); padding:10px 12px; outline:none;";

    const findSiblingInputs = (fieldName) => {
      if (typeof document === "undefined") return [];

      const wrapper = wrapperRef.value;
      const formRoot =
        wrapper?.closest("form") ??
        wrapper?.closest("[role='main']") ??
        wrapper?.parentElement ??
        document;

      const scopedSelectors = [
        `[data-field="${fieldName}"] input`,
        `[data-field="${fieldName}"] textarea`,
        `[data-field="${fieldName}"] select`,
        `input[name="${fieldName}"]`,
        `textarea[name="${fieldName}"]`,
        `select[name="${fieldName}"]`,
      ];

      const scopedMatches = scopedSelectors.flatMap((selector) =>
        Array.from(formRoot.querySelectorAll(selector)),
      );

      if (scopedMatches.length > 0) {
        return scopedMatches;
      }

      return Array.from(
        document.querySelectorAll(
          [
            `[data-field="${fieldName}"] input`,
            `[data-field="${fieldName}"] textarea`,
            `[data-field="${fieldName}"] select`,
            `input[name="${fieldName}"]`,
            `textarea[name="${fieldName}"]`,
            `select[name="${fieldName}"]`,
          ].join(", "),
        ),
      );
    };

    const getSiblingValue = (fieldName) => {
      const target = findSiblingInputs(fieldName)[0];
      return String(target?.value ?? "").trim();
    };

    const pushValueIntoSiblingInput = (fieldName, value) => {
      const targets = findSiblingInputs(fieldName);
      const nextValue = String(value ?? "");

      for (const target of targets) {
        target.value = nextValue;
        target.setAttribute("value", nextValue);
        target.dispatchEvent(new Event("input", { bubbles: true }));
        target.dispatchEvent(new Event("change", { bubbles: true }));
        target.dispatchEvent(new Event("blur", { bubbles: true }));
      }
    };

    const setField = (fieldName, value) => {
      emit("setFieldValue", fieldName, value);
      pushValueIntoSiblingInput(fieldName, value);
    };

    const triggerFilePicker = () => {
      fileInputRef.value?.click();
    };

    const handleUpload = async (event) => {
      const file = event?.target?.files?.[0];

      if (!file) {
        return;
      }

      isUploading.value = true;
      status.value = "Upload direct vers Cloudinary...";
      statusTone.value = "neutral";

      try {
        const publicId = String(customPublicId.value || "").trim();
        const response = await api.post("/cloudinary-upload/sign", {
          assetFolder: selectedFolder.value,
          publicId: publicId || undefined,
        });

        const signature = response?.data?.data;
        const formData = new FormData();

        formData.append("file", file);
        formData.append("api_key", signature.apiKey);
        formData.append("asset_folder", signature.assetFolder);
        formData.append("signature", signature.signature);
        formData.append("timestamp", String(signature.timestamp));

        if (signature.publicId) {
          formData.append("public_id", signature.publicId);
        }

        const uploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
          {
            method: "POST",
            body: formData,
          },
        );

        if (!uploadResponse.ok) {
          throw new Error(`Cloudinary upload failed with status ${uploadResponse.status}`);
        }

        const uploaded = await uploadResponse.json();
        const finalPublicId = uploaded.public_id ?? "";
        const finalDeliveryUrl = uploaded.secure_url ?? "";
        const titleValue = getSiblingValue("title");

        emit("input", finalPublicId);
        setField("public_id", finalPublicId);
        setField("delivery_url", finalDeliveryUrl);
        setField("width", uploaded.width ?? "");
        setField("height", uploaded.height ?? "");
        setField("format", uploaded.format ?? "");
        setField("resource_type", uploaded.resource_type ?? "image");
        setField("bytes", uploaded.bytes ?? "");
        setField("folder", signature.assetFolder ?? selectedFolder.value);

        if (!titleValue) {
          setField("title", stripFileExtension(file.name));
        }

        publicIdValue.value = finalPublicId;
        previewUrl.value = createPreviewUrl(finalPublicId, finalDeliveryUrl);
        status.value = "Image envoyee. Sauvegarde maintenant cet item Directus.";
        statusTone.value = "success";
      } catch (error) {
        status.value = "Upload Cloudinary indisponible pour le moment.";
        statusTone.value = "error";
      } finally {
        isUploading.value = false;
        if (fileInputRef.value) {
          fileInputRef.value.value = "";
        }
      }
    };

    return () =>
      h("div", { ref: wrapperRef, style: "display:flex; flex-direction:column; gap:12px;" }, [
        h("input", {
          ref: fileInputRef,
          type: "file",
          accept: "image/*",
          onChange: handleUpload,
          style: "display:none;",
          disabled: props.disabled || isUploading.value,
        }),
        h("div", { style: "display:grid; gap:12px;" }, [
          h("select", {
            value: selectedFolder.value,
            onChange: (event) => {
              selectedFolder.value = event?.target?.value ?? DEFAULT_FOLDERS[0];
            },
            disabled: props.disabled || isUploading.value,
            style: fieldStyle,
          }, DEFAULT_FOLDERS.map((folder) => h("option", { value: folder }, folder))),
          h("input", {
            value: customPublicId.value,
            onInput: (event) => {
              customPublicId.value = event?.target?.value ?? "";
            },
            disabled: props.disabled || isUploading.value,
            placeholder: "public_id custom (optionnel)",
            style: fieldStyle,
          }),
          h("div", { style: "display:flex; gap:12px; align-items:center; flex-wrap:wrap;" }, [
            h("button", {
              type: "button",
              onClick: triggerFilePicker,
              disabled: props.disabled || isUploading.value,
              style: props.disabled || isUploading.value
                ? `${buttonStyle} opacity:0.65; cursor:not-allowed;`
                : buttonStyle,
            }, isUploading.value ? "Upload en cours..." : "Choisir une image et envoyer"),
            publicIdValue.value
              ? h("code", {
                style:
                  "font-size:12px; line-height:1.4; background:var(--theme--background-normal); padding:6px 8px; border-radius:8px; color:var(--theme--foreground-subdued);",
              }, publicIdValue.value)
              : null,
          ]),
        ]),
        previewUrl.value
          ? h("img", {
              src: previewUrl.value,
              alt: publicIdValue.value || "Cloudinary preview",
              style:
                "width:100%; max-width:320px; aspect-ratio:4/3; object-fit:cover; border-radius:16px; border:1px solid var(--theme--border-normal);",
            })
          : null,
        status.value
          ? h(
              "div",
              {
                style: `font-size:12px; line-height:1.5; ${statusClass.value}`,
              },
              status.value,
            )
          : null,
      ]);
  },
};
