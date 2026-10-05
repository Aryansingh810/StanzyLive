export type PropertyImageEntry = {
  uri: string;
  category: string;
};

export function parsePropertyImage(value: string): PropertyImageEntry {
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "uri" in parsed &&
      typeof parsed.uri === "string"
    ) {
      return {
        uri: parsed.uri,
        category:
          "category" in parsed && typeof parsed.category === "string"
            ? parsed.category
            : "Other",
      };
    }
  } catch {
    // Existing rows store image URLs directly.
  }

  return { uri: value, category: "Photos" };
}

export function serializePropertyImage(entry: PropertyImageEntry): string {
  return JSON.stringify(entry);
}
