import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function crawlWebsite(url) {
  const { data } = await api.post("/crawl", { url });
  return data;
}

export async function askQuestion(question) {
  const { data } = await api.post("/chat", { question });
  return data;
}

export default api;