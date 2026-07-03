import { account } from "./config";

export const loginWithGoogle = async () => {
  await account.createOAuth2Session(
    "google" as any,
    window.location.origin,
    window.location.origin + "/login"
  );
};

export const logout = async () => {
  await account.deleteSession("current");
};

export const getCurrentUser = async () => {
  try {
    return await account.get();
  } catch {
    return null;
  }
};
