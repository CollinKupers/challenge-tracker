const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers, body: "" };
  try {
    const store = getStore("challenge-data");
    if (event.httpMethod === "GET") {
      const key = event.queryStringParameters?.key;
      if (!key) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing key" }) };
      const value = await store.get(key);
      return { statusCode: 200, headers, body: JSON.stringify({ value: value ?? null }) };
    }
    if (event.httpMethod === "POST") {
      const { key, value } = JSON.parse(event.body || "{}");
      if (!key) return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing key" }) };
      await store.set(key, value);
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
