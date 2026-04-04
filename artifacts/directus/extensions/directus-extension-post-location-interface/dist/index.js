import InterfaceComponent from "./location-interface.js";

export default {
  id: "travelogue-location-geocode",
  name: "Travelogue Location Geocode",
  icon: "place",
  description: "Geocode the post location and update coordinates live.",
  component: InterfaceComponent,
  options: null,
  types: ["string"],
  localTypes: ["standard"],
  group: "other",
};
