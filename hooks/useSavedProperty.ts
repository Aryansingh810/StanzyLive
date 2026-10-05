import { useSupabase } from "@/hooks/useSupabase";
import { Property } from "@/types";
import { useUser } from "@clerk/expo";
import { useEffect, useState } from "react";
import { create } from "zustand";

type SavedPropertiesState = {
  savedProperties: Property[];
  savedPropertyIds: string[];
  loading: boolean;
  loadedUserId: string | null;
  loadingUserId: string | null;
  errorMessage: string;
  startLoading: (userId: string) => void;
  setLoadedProperties: (userId: string, properties: Property[]) => void;
  setLoadError: (userId: string, message: string) => void;
  setSavedStatus: (property: Property, isSaved: boolean) => void;
  toggleSavedProperty: (property: Property) => boolean;
};

export const useSavedPropertiesStore = create<SavedPropertiesState>()(
  (set) => ({
    savedProperties: [],
    savedPropertyIds: [],
    loading: false,
    loadedUserId: null,
    loadingUserId: null,
    errorMessage: "",
    startLoading: (userId) =>
      set({
        savedProperties: [],
        savedPropertyIds: [],
        loading: true,
        loadedUserId: null,
        loadingUserId: userId,
        errorMessage: "",
      }),
    setLoadedProperties: (userId, properties) =>
      set((state) =>
        state.loadingUserId !== userId
          ? state
          : {
              savedProperties: properties,
              savedPropertyIds: properties.map((property) => property.id),
              loading: false,
              loadedUserId: userId,
              loadingUserId: null,
              errorMessage: "",
            },
      ),
    setLoadError: (userId, message) =>
      set((state) =>
        state.loadingUserId !== userId
          ? state
          : {
              loading: false,
              loadedUserId: userId,
              loadingUserId: null,
              errorMessage: message,
            },
      ),
    setSavedStatus: (property, isSaved) =>
      set((state) => ({
        savedProperties: isSaved
          ? state.savedProperties.some((saved) => saved.id === property.id)
            ? state.savedProperties
            : [property, ...state.savedProperties]
          : state.savedProperties.filter((saved) => saved.id !== property.id),
        savedPropertyIds: isSaved
          ? state.savedPropertyIds.includes(property.id)
            ? state.savedPropertyIds
            : [property.id, ...state.savedPropertyIds]
          : state.savedPropertyIds.filter((id) => id !== property.id),
      })),
    toggleSavedProperty: (property) => {
      let nextIsSaved = false;
      set((state) => {
        nextIsSaved = !state.savedPropertyIds.includes(property.id);
        return {
          savedProperties: nextIsSaved
            ? [
                property,
                ...state.savedProperties.filter(
                  (saved) => saved.id !== property.id,
                ),
              ]
            : state.savedProperties.filter((saved) => saved.id !== property.id),
          savedPropertyIds: nextIsSaved
            ? [
                property.id,
                ...state.savedPropertyIds.filter((id) => id !== property.id),
              ]
            : state.savedPropertyIds.filter((id) => id !== property.id),
        };
      });
      return nextIsSaved;
    },
  }),
);

export function useSavedProperties() {
  const { user } = useUser();
  const supabase = useSupabase();
  const userId = user?.id;
  const savedProperties = useSavedPropertiesStore(
    (state) => state.savedProperties,
  );
  const loading = useSavedPropertiesStore((state) => state.loading);
  const errorMessage = useSavedPropertiesStore((state) => state.errorMessage);
  const startLoading = useSavedPropertiesStore((state) => state.startLoading);
  const setLoadedProperties = useSavedPropertiesStore(
    (state) => state.setLoadedProperties,
  );
  const setLoadError = useSavedPropertiesStore((state) => state.setLoadError);
  useEffect(() => {
    if (!userId) return;

    const currentState = useSavedPropertiesStore.getState();
    if (
      currentState.loadedUserId === userId ||
      currentState.loadingUserId === userId
    ) {
      return;
    }

    startLoading(userId);

    const loadSavedProperties = async () => {
      try {
        const { data: savedRows, error: savedError } = await supabase
          .from("saved_properties")
          .select("property_id")
          .eq("user_clerk_id", userId);

        if (savedError) throw savedError;

        const propertyIds = (savedRows ?? []).map((row) => row.property_id);
        if (!propertyIds.length) {
          setLoadedProperties(userId, []);
          return;
        }

        const { data: properties, error: propertiesError } = await supabase
          .from("properties")
          .select("*")
          .in("id", propertyIds);

        if (propertiesError) throw propertiesError;
        setLoadedProperties(userId, (properties as Property[] | null) ?? []);
      } catch (error) {
        console.error("Could not load saved properties:", error);
        const message =
          typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof error.message === "string"
            ? error.message
            : "Could not load saved properties.";
        setLoadError(userId, message);
      }
    };

    void loadSavedProperties();
  }, [setLoadError, setLoadedProperties, startLoading, supabase, userId]);

  return { savedProperties, loading, errorMessage, userId, supabase };
}

export function useSavedProperty(propertyId: string) {
  const { savedProperties, loading, userId, supabase } = useSavedProperties();
  const setSavedStatus = useSavedPropertiesStore(
    (state) => state.setSavedStatus,
  );
  const toggleSavedProperty = useSavedPropertiesStore(
    (state) => state.toggleSavedProperty,
  );
  const [saving, setSaving] = useState(false);
  const isSaved = useSavedPropertiesStore((state) =>
    state.savedPropertyIds.includes(propertyId),
  );

  const toggleSave = async (property?: Property) => {
    if (!property || !userId || saving) return;

    const nextIsSaved = toggleSavedProperty(property);
    setSaving(true);

    try {
      if (nextIsSaved) {
        const { error } = await supabase.from("saved_properties").insert({
          user_clerk_id: userId,
          property_id: property.id,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_properties")
          .delete()
          .eq("user_clerk_id", userId)
          .eq("property_id", property.id);
        if (error) throw error;
      }
    } catch (error) {
      setSavedStatus(property, !nextIsSaved);
      throw error;
    } finally {
      setSaving(false);
    }
  };

  return {
    isSaved,
    saveLoading: loading || saving,
    savedProperties,
    toggleSave,
  };
}
