
import {
  createContext,
  useContext,
  useState
} from "react";

import {
  signInWithPopup,
  signOut
} from "firebase/auth";

import {
  auth,
  googleProvider
} from "../firebase";

const AuthContext = createContext(null);

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Save login session
function saveSession(data) {
  if (!data?.token || !data?.user) {
    throw new Error("Invalid authentication response from server.");
  }

  localStorage.setItem("train-auth-token", data.token);
  localStorage.setItem(
    "train-demo-user",
    JSON.stringify(data.user)
  );

  return data.user;
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
    throw new Error(
      data.message || "Authentication failed."
    );
  }

  return data;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("train-demo-user")
      ) || null;
    } catch {
      return null;
    }
  });

  // EMAIL SIGNUP
  async function signup({ name, email, password }) {
    const data = await authRequest("register", {
      name,
      email,
      password
    });

    const loggedInUser = saveSession(data);

    setUser(loggedInUser);

    return loggedInUser;
  }

  // EMAIL LOGIN
  async function login({ email, password }) {
    const data = await authRequest("login", {
      email,
      password
    });

    const loggedInUser = saveSession(data);

    setUser(loggedInUser);

    return loggedInUser;
  }

  // GOOGLE LOGIN / SIGNUP
  async function googleLogin() {
    try {
      const result = await signInWithPopup(
        auth,
        googleProvider
      );

      const idToken = await result.user.getIdToken();

      const data = await authRequest("google", {
        idToken
      });

      const loggedInUser = saveSession(data);

      setUser(loggedInUser);

      return loggedInUser;

    } catch (error) {
      // Close Firebase session if backend authentication fails
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

      throw new Error(
        error.message || "Google login failed."
      );
    }
  }

  // LOGOUT
  async function logout() {
    clearSession();
    setUser(null);

    try {
      await signOut(auth);
    } catch (error) {
      console.error(
        "Firebase logout error:",
        error.message
      );
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        signup,
        login,
        googleLogin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
