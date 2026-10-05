import { useSupabase } from "@/hooks/useSupabase";
import { useUserStore } from "@/store/userStore";
import { useUser } from "@clerk/expo";
import { useEffect, useRef } from "react";

export const useUserSync = () => {
  const { user } = useUser();
  const setIsAdmin = useUserStore((state) => state.setisAdmin);
  const authSupabase = useSupabase();
  const supabaseRef = useRef(authSupabase);
  supabaseRef.current = authSupabase;
  const userRef = useRef(user);
  userRef.current = user;
  const userId = user?.id;

  useEffect(() => {
    setIsAdmin(false);
    if (!userId) return;

    let isActive = true;

    const syncUser = async () => {
      const client = supabaseRef.current;
      const { data, error } = await client
        .from("users")
        .select("clerk_id, is_admin")
        .eq("clerk_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        if (isActive) setIsAdmin(data.is_admin ?? false);
        return;
      }

      const currentUser = userRef.current;
      if (!currentUser || currentUser.id !== userId) return;

      const { data: newUser, error: insertError } = await client
        .from("users")
        .insert({
          clerk_id: userId,
          email: currentUser.emailAddresses[0]?.emailAddress ?? null,
          first_name: currentUser.firstName,
          last_name: currentUser.lastName,
          avatar_url: currentUser.imageUrl,
        })
        .select("is_admin")
        .single();

      if (insertError) throw insertError;
      if (isActive) setIsAdmin(newUser?.is_admin ?? false);
    };

    void syncUser().catch((error) => {
      console.error("Could not sync user:", error);
    });

    return () => {
      isActive = false;
    };
  }, [setIsAdmin, userId]);
};
