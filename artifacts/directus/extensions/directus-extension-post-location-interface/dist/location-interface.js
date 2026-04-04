import { computed, h, ref, watch } from "vue";
import { useApi } from "@directus/extensions-sdk";

function debounce(fn, delay) {
  let timeoutId = null;

  return (...args) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn(...args);
    }, delay);
  };
}

export default {
  props: {
    value: {
      type: String,
      default: "",
    },
  },
  emits: ["input", "setFieldValue"],
  setup(props, { emit }) {
    const api = useApi();
    const inputValue = ref(props.value ?? "");
    const status = ref("");
    const statusTone = ref("neutral");
    const lastGeocodedQuery = ref("");

    watch(
      () => props.value,
      (value) => {
        inputValue.value = value ?? "";
      },
    );

    const statusClass = computed(() => {
      if (statusTone.value === "success") return "color: var(--theme--success);";
      if (statusTone.value === "error") return "color: var(--theme--danger);";
      return "color: var(--theme--foreground-subdued);";
    });

    const geocodeInBackground = debounce(async (rawLocation) => {
      const location = String(rawLocation ?? "").trim();

      if (!location) {
        status.value = "";
        lastGeocodedQuery.value = "";
        return;
      }

      if (location === lastGeocodedQuery.value) {
        return;
      }

      status.value = "Recherche des coordonnees...";
      statusTone.value = "neutral";

      try {
        const response = await api.get("/location-geocode", {
          params: { q: location },
        });

        const coordinates = response?.data?.data ?? null;

        if (!coordinates) {
          status.value = "Aucune coordonnee trouvee pour cette location.";
          statusTone.value = "error";
          return;
        }

        emit("setFieldValue", "latitude", coordinates.latitude);
        emit("setFieldValue", "longitude", coordinates.longitude);
        pushValueIntoSiblingInput("latitude", coordinates.latitude);
        pushValueIntoSiblingInput("longitude", coordinates.longitude);

        lastGeocodedQuery.value = location;
        status.value = "Coordonnees mises a jour.";
        statusTone.value = "success";
      } catch (error) {
        status.value = "Geocodage indisponible pour le moment.";
        statusTone.value = "error";
      }
    }, 600);

    const handleInput = (event) => {
      const nextValue = event?.target?.value ?? "";
      inputValue.value = nextValue;
      emit("input", nextValue);
      geocodeInBackground(nextValue);
    };

    const handleBlur = () => {
      geocodeInBackground(inputValue.value);
    };

    return () =>
      h("div", { style: "display:flex; flex-direction:column; gap:8px;" }, [
        h("input", {
          value: inputValue.value,
          onInput: handleInput,
          onBlur: handleBlur,
          placeholder: "Ex. Rome, Italie",
          style:
            "width:100%; border:1px solid var(--theme--border-normal); border-radius:var(--theme--border-radius); background:var(--theme--background-page); color:var(--theme--foreground-normal); padding:10px 12px; outline:none;",
        }),
        status.value
          ? h(
              "div",
              {
                style: `font-size:12px; line-height:1.4; ${statusClass.value}`,
              },
              status.value,
            )
          : null,
      ]);
  },
};
    const pushValueIntoSiblingInput = (fieldName, value) => {
      if (typeof document === "undefined") return;

      const selectors = [
        `input[name="${fieldName}"]`,
        `[data-field="${fieldName}"] input`,
        `[data-field="${fieldName}"] textarea`,
      ];

      const target = selectors
        .map((selector) => document.querySelector(selector))
        .find(Boolean);

      if (!target) {
        return;
      }

      const nextValue = String(value ?? "");

      target.value = nextValue;
      target.setAttribute("value", nextValue);
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
      target.dispatchEvent(new Event("blur", { bubbles: true }));
    };
