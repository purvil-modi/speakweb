import axios from "axios";

const api = axios.create({
  baseURL: "/",
  headers: { "Content-Type": "application/json" },
});

export async function crawlWebsite(url) {
  const { data } = await api.post("/crawl", { url });
  return data;
}

