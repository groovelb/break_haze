import { ALBUMS_DATA, getAlbumsByGenre } from '../constants';
import { EnrichedAlbum } from '../types';
import { GenreId } from '../genre-config';

const FALLBACK_ARTWORK = 'https://picsum.photos/600/600?grayscale';
const CACHE_PREFIX = 'preview_v1:';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (url: string, retries = 2) => {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      throw new Error(`Status: ${response.status}`);
    } catch (error) {
      if (i === retries) throw error;
      await delay(500 * (i + 1));
    }
  }
  throw new Error('All retries failed');
};

// --- localStorage preview URL cache ---

function getCachedPreview(key: string): { previewUrl: string; artworkUrl?: string } | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Expire after 7 days
    if (Date.now() - parsed.ts > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setCachedPreview(key: string, previewUrl: string, artworkUrl?: string) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ previewUrl, artworkUrl, ts: Date.now() }));
  } catch {
    // Storage full — ignore
  }
}

// --- Phase 1: Instant local albums (no API calls) ---

export function getLocalAlbums(genreId?: GenreId): EnrichedAlbum[] {
  const sourceData = genreId ? getAlbumsByGenre(genreId) : ALBUMS_DATA;
  const results: EnrichedAlbum[] = [];

  for (const group of sourceData) {
    for (const album of group.albums) {
      const id = `${group.artist}-${album.title}`.replace(/\s+/g, '-').toLowerCase();
      const cacheKey = `${group.artist}::${album.key_track}`;
      const cached = getCachedPreview(cacheKey);

      results.push({
        ...album,
        artist: group.artist,
        genre: group.genre,
        genre_style: group.genre_style,
        genreId: group.genreId,
        artworkUrl: cached?.artworkUrl || album.artworkUrl || FALLBACK_ARTWORK,
        previewUrl: cached?.previewUrl || null,
        itunesLink: album.itunesLink || null,
        id,
      });
    }
  }

  return results.sort((a, b) => a.year - b.year);
}

// --- Phase 2: Progressive preview URL fetching ---

const BATCH_SIZE = 10;
const BATCH_DELAY = 200;

export async function fetchPreviewUrls(
  albums: EnrichedAlbum[],
  onBatchReady: (updated: Map<string, { previewUrl: string; artworkUrl?: string }>) => void,
): Promise<void> {
  // Filter to albums that still need a preview URL
  const needsFetch = albums.filter(a => !a.previewUrl);
  if (needsFetch.length === 0) return;

  for (let i = 0; i < needsFetch.length; i += BATCH_SIZE) {
    const batch = needsFetch.slice(i, i + BATCH_SIZE);
    const updates = new Map<string, { previewUrl: string; artworkUrl?: string }>();

    const batchPromises = batch.map(async (album) => {
      const cacheKey = `${album.artist}::${album.key_track}`;

      try {
        const trackQuery = `${album.artist} ${album.key_track}`;
        const trackRes = await fetchWithRetry(
          `https://itunes.apple.com/search?term=${encodeURIComponent(trackQuery)}&entity=song&limit=1`
        );
        const trackData = await trackRes.json();

        if (trackData.resultCount > 0) {
          const previewUrl = trackData.results[0].previewUrl;
          let artworkUrl: string | undefined;

          if (!album.artworkUrl?.includes('itunes') && trackData.results[0].artworkUrl100) {
            artworkUrl = trackData.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
          }

          if (previewUrl) {
            setCachedPreview(cacheKey, previewUrl, artworkUrl);
            updates.set(album.id, { previewUrl, artworkUrl });
          }
        }
      } catch (e) {
        console.warn(`Track fetch failed for ${album.title}`, e);
      }
    });

    await Promise.all(batchPromises);

    if (updates.size > 0) {
      onBatchReady(updates);
    }

    if (i + BATCH_SIZE < needsFetch.length) {
      await delay(BATCH_DELAY);
    }
  }
}

// --- Legacy: blocking fetch (kept for compatibility) ---

export const fetchEnrichedAlbums = async (genreId?: GenreId): Promise<EnrichedAlbum[]> => {
  const albums = getLocalAlbums(genreId);
  await fetchPreviewUrls(albums, (updates) => {
    for (const album of albums) {
      const update = updates.get(album.id);
      if (update) {
        album.previewUrl = update.previewUrl;
        if (update.artworkUrl) album.artworkUrl = update.artworkUrl;
      }
    }
  });
  return albums;
};
