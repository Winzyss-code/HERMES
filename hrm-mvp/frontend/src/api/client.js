import axios from "axios";

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

const client = axios.create({
  baseURL: "http://localhost:8000",
});

client.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

export default client;
