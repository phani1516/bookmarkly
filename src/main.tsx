import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";

// Inject favicon at runtime to ensure it works with vite-plugin-singlefile
const FAVICON_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='64' y2='64' gradientUnits='userSpaceOnUse'><stop stop-color='%236C5CE7'/><stop offset='.5' stop-color='%23A29BFE'/><stop offset='1' stop-color='%2374b9ff'/></linearGradient></defs><rect width='64' height='64' rx='14' fill='url(%23g)'/><path d='M44 50l-12-8.5L20 50V18a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v32z' stroke='white' stroke-width='3.5' stroke-linecap='round' stroke-linejoin='round' fill='rgba(255,255,255,0.15)'/></svg>`;

function setFavicon() {
  // Remove any existing favicons
  document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]').forEach(el => el.remove());

  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/svg+xml";
  link.href = `data:image/svg+xml,${FAVICON_SVG}`;
  document.head.appendChild(link);

  // Also generate a canvas-based PNG favicon for browsers that don't support SVG favicons
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, 64, 64);
        const pngUrl = canvas.toDataURL("image/png");

        // Add PNG fallback favicon
        const pngLink = document.createElement("link");
        pngLink.rel = "icon";
        pngLink.type = "image/png";
        pngLink.sizes = "64x64";
        pngLink.href = pngUrl;
        document.head.appendChild(pngLink);

        // Add apple-touch-icon (requires PNG)
        document.querySelectorAll('link[rel="apple-touch-icon"]').forEach(el => el.remove());
        const appleLink = document.createElement("link");
        appleLink.rel = "apple-touch-icon";
        appleLink.href = pngUrl;
        document.head.appendChild(appleLink);
      };
      // Use a clean SVG for the image source (not URL-encoded)
      const svgClean = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse"><stop stop-color="#6C5CE7"/><stop offset=".5" stop-color="#A29BFE"/><stop offset="1" stop-color="#74b9ff"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="url(#g)"/><path d="M44 50l-12-8.5L20 50V18a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v32z" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" fill="rgba(255,255,255,0.15)"/></svg>`;
      img.src = `data:image/svg+xml;base64,${btoa(svgClean)}`;
    }
  } catch {
    // Canvas fallback failed, SVG favicon still works
  }
}

setFavicon();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
