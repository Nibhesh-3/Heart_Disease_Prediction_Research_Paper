import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

export const getToken = () => AsyncStorage.getItem("access_token");

export const clearToken = async () => {
  try {
    await AsyncStorage.removeItem("access_token");
  } catch (_) {}
  try {
    await GoogleSignin.signOut();
  } catch (_) {}
};
