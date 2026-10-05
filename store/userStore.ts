import { create } from "zustand";

interface UserStore {
  isAdmin: boolean;
  setisAdmin: (value: boolean) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  isAdmin: false,
  setisAdmin: (value) =>
    set((state) => (state.isAdmin === value ? state : { isAdmin: value })),
}));
