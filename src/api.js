import axios from "axios";

// api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";


const api = axios.create({
  baseURL: API_BASE_URL,
});

export { api, API_BASE_URL };
