/**
 * Utility functions for YouTube URL parsing
 */

export interface YouTubeVideoInfo {
  videoId: string;
  isValid: boolean;
}

/**
 * Extracts video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): YouTubeVideoInfo | null {
  if (!url || typeof url !== 'string') return null;

  // Remove whitespace
  const cleanUrl = url.trim();

  // YouTube URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      return {
        videoId: match[1],
        isValid: true
      };
    }
  }

  return null;
}

/**
 * Checks if a URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return /youtube\.com|youtu\.be/.test(url.trim()) || extractYouTubeVideoId(url) !== null;
}

/**
 * Converts YouTube URL to embed URL
 */
export function getYouTubeEmbedUrl(videoId: string, autoplay = false, loop = true, start = 0): string {
  const params = new URLSearchParams({
    enablejsapi: '1',
    origin: window.location.origin,
    autoplay: autoplay ? '1' : '0',
    loop: loop ? '1' : '0',
    playlist: loop ? videoId : undefined,
    start: start.toString(),
    controls: '0',
    modestbranding: '1',
    rel: '0',
    showinfo: '0',
  } as Record<string, string>);

  // Remove undefined values
  if (!loop) params.delete('playlist');

  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Gets YouTube video thumbnail URL
 * @param videoId - YouTube video ID
 * @param quality - Thumbnail quality: 'maxresdefault' (highest), 'hqdefault' (high), 'mqdefault' (medium), 'sddefault' (standard)
 * @returns URL to the thumbnail image
 */
export function getYouTubeThumbnail(videoId: string, quality: 'maxresdefault' | 'hqdefault' | 'mqdefault' | 'sddefault' = 'maxresdefault'): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

