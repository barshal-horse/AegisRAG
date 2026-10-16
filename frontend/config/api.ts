// Centralized API Base URL for AegisRAG
export const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? (process.env.NEXT_PUBLIC_API_URL.endsWith("/api/v1")
      ? process.env.NEXT_PUBLIC_API_URL
      : `${process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")}/api/v1`)
  : "http://localhost:8000/api/v1";
