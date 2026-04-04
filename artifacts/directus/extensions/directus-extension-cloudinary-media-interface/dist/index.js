import InterfaceComponent from "./media-interface.js";

export default {
  id: "travelogue-cloudinary-media-upload",
  name: "Travelogue Cloudinary Upload",
  icon: "cloud_upload",
  description: "Upload an image directly to Cloudinary and fill related media metadata.",
  component: InterfaceComponent,
  options: null,
  types: ["text"],
  localTypes: ["standard"],
  group: "other",
};
