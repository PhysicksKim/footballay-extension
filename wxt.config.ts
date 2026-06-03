import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  manifestVersion: 3,
  manifest: {
    name: "Footballay",
    description: "Compact live football stats overlay for streaming pages.",
    permissions: ["storage", "activeTab"],
    host_permissions: [
      "https://api.footballay.com/*",
      "https://www.coupangplay.com/*",
      "https://www.spotvnow.co.kr/*"
    ],
    content_security_policy: {
      extension_pages:
        "script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; object-src 'self';"
    }
  }
});
