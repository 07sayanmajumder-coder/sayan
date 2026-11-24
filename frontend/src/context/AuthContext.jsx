
import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback
} from "react";

import {
  signInWithPopup,
  signOut
} from "firebase/auth";

import {
  auth,
  googleProvider
} from "../firebase";

const AuthContext = createContext(undefined);

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Normalize user data
function normalizeUser(user) {
  if (!user) return null;

  return {
    ...user,
    email: String(user.email || "").trim().toLowerCase()
  };
}

// Save login session
function saveSession(data) {
  if (!data?.token || !data?.user) {
    throw new Error("Invalid authentication response from server.");
  }

  const normalizedUser = normalizeUser(data.user);

  localStorage.setItem("train-auth-token", data.token);
  localStorage.setItem(
    "train-demo-user",
    JSON.stringify(normalizedUser)
  );

  return normalizedUser;
}

// Remove login session
function clearSession() {
  localStorage.removeItem("train-auth-token");
  localStorage.removeItem("train-demo-user");
}

// Backend API request
async function authRequest(endpoint, body) {
  let response;

  try {
    response = await fetch(`${API_URL}/auth/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
  } catch {
    throw new Error(
      "Cannot connect to the server. Please check your backend."
    );
  }

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Authentication failed.");
  }

  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("train-demo-user");

      return normalizeUser(
        storedUser ? JSON.parse(storedUser) : null
      );
    } catch (error) {
      console.error("Session restoration error:", error);
      clearSession();
      return null;
    }
  });

  // EMAIL SIGNUP
  const signup = useCallback(async ({ name, email, password }) => {
    const data = await authRequest("register", {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password
    });

    const loggedInUser = saveSession(data);
    setUser(loggedInUser);

    return loggedInUser;
  }, []);

  // EMAIL LOGIN
  const login = useCallback(async ({ email, password }) => {
    const data = await authRequest("login", {
      email: email.trim().toLowerCase(),
      password
    });

    const loggedInUser = saveSession(data);
    setUser(loggedInUser);

    return loggedInUser;
  }, []);

  // GOOGLE LOGIN / SIGNUP
  const googleLogin = useCallback(async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const data = await authRequest("google", {
        idToken
      });

      const loggedInUser = saveSession(data);
      setUser(loggedInUser);

      return loggedInUser;

    } catch (error) {
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.error(
          "Firebase sign-out error:",
          signOutError.message
        );
      }

      if (error.code === "auth/popup-closed-by-user") {
        throw new Error("Google sign-in was cancelled.");
      }

      if (error.code === "auth/popup-blocked") {
        throw new Error(
          "Your browser blocked the Google sign-in popup."
        );
      }

      if (error.code === "auth/unauthorized-domain") {
        throw new Error(
          "This domain is not authorized in Firebase."
        );
      }

      throw new Error(error.message || "Google login failed.");
    }
  }, []);

  // LOGOUT
  const logout = useCallback(async () => {
    clearSession();
    setUser(null);

    try {
      await signOut(auth);
    } catch (error) {
      console.error("Firebase logout error:", error.message);
    }
  }, []);

  // Current user's email for booking and notifications
  const userEmail = user?.email || "";

  // Shared authentication context
  const contextValue = useMemo(() => ({
    user,
    userEmail,
    signup,
    login,
    googleLogin,
    logout
  }), [
    user,
    userEmail,
    signup,
    login,
    googleLogin,
    logout
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Authentication hook
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth must be used inside an AuthProvider. Check main.jsx."
    );
  }

  return context;
}
