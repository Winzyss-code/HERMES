import { createContext, useContext, useMemo, useState } from "react";
import axios from "axios";

import { setAuthToken } from "../api/client";
import { deriveKey } from "../crypto/encryption";


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [cryptoKey, setCryptoKey] = useState(null);
  const [role, setRole] = useState(null);

  const login = async (email, password) => {
    const response = await axios.post("http://localhost:8000/auth/login", {
      email,
      password,
    });
    const { access_token, user: userInfo } = response.data;
    const derivedKey = await deriveKey(password, email);

    setUser(userInfo);
    setRole(userInfo.role);
    setToken(access_token);
    setCryptoKey(derivedKey);
    setAuthToken(access_token);
    return userInfo;
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setToken(null);
    setCryptoKey(null);
    setAuthToken(null);
  };

  const value = useMemo(
    () => ({ user, token, cryptoKey, role, login, logout }),
    [user, token, cryptoKey, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
