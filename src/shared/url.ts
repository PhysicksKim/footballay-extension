import { supportedStreamingHosts } from "./constants";

export function isSupportedStreamingUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return supportedStreamingHosts.includes(parsedUrl.hostname);
  } catch {
    return false;
  }
}
