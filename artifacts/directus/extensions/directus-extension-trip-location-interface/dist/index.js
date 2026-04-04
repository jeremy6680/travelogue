import InterfaceComponent from "./location-interface.js";

export default {
  id: "travelogue-trip-location-geocode",
  name: "Travelogue Trip Location Geocode",
  icon: "travel_explore",
  description: "Geocode the first visited city and update trip coordinates live.",
  component: InterfaceComponent,
  options: null,
  types: ["string"],
  localTypes: ["standard"],
  group: "other",
};
