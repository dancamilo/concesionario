import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// El "base" debe coincidir con el nombre del repositorio en GitHub Pages.
export default defineConfig({
  base: "/concesionario/",
  plugins: [react()],
});
