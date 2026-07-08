import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT: base must match your GitHub repo name exactly, e.g. '/qamar/'
// If your repo is named something else, change the string below to match.
export default defineConfig({
  plugins: [react()],
  base: "/qamar/",
});
