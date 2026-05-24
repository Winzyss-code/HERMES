import { createContext, useContext, useEffect, useMemo, useState } from "react";

import client from "../api/client";
import { DEFAULT_MASTER_SECRET, deriveKey } from "../crypto/encryption";


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("hermes_token"));
  const [role, setRole] = useState(() => localStorage.getItem("hermes_role"));
  const [username, setUsername] = useState(() => localStorage.getItem("hermes_username"));
  const [organizationId, setOrganizationId] = useState(() => localStorage.getItem("hermes_organization_id"));
  const [organizationName, setOrganizationName] = useState(() => localStorage.getItem("hermes_organization_name"));
  const [cryptoKey, setCryptoKey] = useState(null);

  useEffect(() => {
    deriveKey(sessionStorage.getItem("hermes_master_secret") || DEFAULT_MASTER_SECRET)
      .then(setCryptoKey)
      .catch(() => setCryptoKey(null));
  }, []);

  const login = async (usernameValue, password, masterSecret) => {
    const response = await client.post("/auth/login", {
      username: usernameValue,
      password,
    });
    const nextToken = response.data.access_token;
    const nextRole = response.data.role;
    const nextOrganizationId = response.data.organization_id || "";
    const nextOrganizationName = response.data.organization_name || "";
    const secret = masterSecret || DEFAULT_MASTER_SECRET;

    localStorage.setItem("hermes_token", nextToken);
    localStorage.setItem("hermes_role", nextRole);
    localStorage.setItem("hermes_username", usernameValue);
    localStorage.setItem("hermes_organization_id", nextOrganizationId);
    localStorage.setItem("hermes_organization_name", nextOrganizationName);
    sessionStorage.setItem("hermes_master_secret", secret);

    setToken(nextToken);
    setRole(nextRole);
    setUsername(usernameValue);
    setOrganizationId(nextOrganizationId);
    setOrganizationName(nextOrganizationName);
    setCryptoKey(await deriveKey(secret));
    return nextRole;
  };

  const registerOrganization = async (organizationNameValue, usernameValue, password, masterSecret) => {
    const response = await client.post("/auth/register-organization", {
      organization_name: organizationNameValue,
      username: usernameValue,
      password,
    });
    const nextToken = response.data.access_token;
    const nextRole = response.data.role;
    const nextOrganizationId = response.data.organization_id || "";
    const nextOrganizationName = response.data.organization_name || "";
    const secret = masterSecret || DEFAULT_MASTER_SECRET;

    localStorage.setItem("hermes_token", nextToken);
    localStorage.setItem("hermes_role", nextRole);
    localStorage.setItem("hermes_username", usernameValue);
    localStorage.setItem("hermes_organization_id", nextOrganizationId);
    localStorage.setItem("hermes_organization_name", nextOrganizationName);
    sessionStorage.setItem("hermes_master_secret", secret);

    setToken(nextToken);
    setRole(nextRole);
    setUsername(usernameValue);
    setOrganizationId(nextOrganizationId);
    setOrganizationName(nextOrganizationName);
    setCryptoKey(await deriveKey(secret));
    return nextRole;
  };

  const logout = () => {
    localStorage.removeItem("hermes_token");
    localStorage.removeItem("hermes_role");
    localStorage.removeItem("hermes_username");
    localStorage.removeItem("hermes_organization_id");
    localStorage.removeItem("hermes_organization_name");
    sessionStorage.removeItem("hermes_master_secret");
    setToken(null);
    setRole(null);
    setUsername(null);
    setOrganizationId(null);
    setOrganizationName(null);
    setCryptoKey(null);
  };

  const value = useMemo(
    () => ({
      token,
      role,
      username,
      organizationId,
      organizationName,
      cryptoKey,
      login,
      registerOrganization,
      logout,
    }),
    [token, role, username, organizationId, organizationName, cryptoKey]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
