/** Extract YouTube video ID from common URL formats */
export function parseYoutubeVideoId(url: string): string | null {
  if (!url?.trim()) return null;
  try {
    const trimmed = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const u = new URL(trimmed);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const embed = u.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embed) return embed[1];
      const live = u.pathname.match(/\/live\/([a-zA-Z0-9_-]{11})/);
      if (live) return live[1];
    }
  } catch {
    return null;
  }
  return null;
}

export function youtubeEmbedUrl(videoId: string, isPrivate?: boolean) {
  const base = `https://www.youtube.com/embed/${videoId}`;
  return isPrivate ? `${base}?rel=0&modestbranding=1` : `${base}?rel=0`;
}

export function youtubeThumbnail(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}
