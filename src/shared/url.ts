import { supportedStreamingHosts } from "./constants";

export function getHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function isSupportedStreamingUrl(url: string): boolean {
  const hostname = getHostname(url);
  return hostname ? supportedStreamingHosts.includes(hostname) : false;
}
