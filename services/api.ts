import { ALBUMS_DATA } from '../constants';
import { EnrichedAlbum } from '../types';

const FALLBACK_ARTWORK = 'https://picsum.photos/600/600?grayscale';

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

export const fetchEnrichedAlbums = async (): Promise<EnrichedAlbum[]> => {
  const flattenedAlbums = [];

  for (const group of ALBUMS_DATA) {
    for (const album of group.albums) {
      flattenedAlbums.push({ group, album });
    }
  }

  const results: EnrichedAlbum[] = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < flattenedAlbums.length; i += BATCH_SIZE) {
    const batch = flattenedAlbums.slice(i, i + BATCH_SIZE);

    const batchPromises = batch.map(async ({ group, album }) => {
      const enriched: EnrichedAlbum = {
        ...album,
        artist: group.artist,
        genre: group.genre,
        genre_style: group.genre_style,
        artworkUrl: album.artworkUrl || FALLBACK_ARTWORK,
        previewUrl: null,
        itunesLink: album.itunesLink || null,
        id: `${group.artist}-${album.title}`.replace(/\s+/g, '-').toLowerCase(),
      };

      // Only fetch preview URL (streaming) from iTunes API
      try {
        const trackQuery = `${group.artist} ${album.key_track}`;
        const trackRes = await fetchWithRetry(
          `https://itunes.apple.com/search?term=${encodeURIComponent(trackQuery)}&entity=song&limit=1`
        );
        const trackData = await trackRes.json();
        if (trackData.resultCount > 0) {
          enriched.previewUrl = trackData.results[0].previewUrl;

          // If artwork is missing locally, grab it from the track result
          if (!album.artworkUrl && trackData.results[0].artworkUrl100) {
            enriched.artworkUrl = trackData.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
          }
        }
      } catch (e) {
        console.warn(`Track fetch failed for ${album.title}`, e);
      }

      return enriched;
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    if (i + BATCH_SIZE < flattenedAlbums.length) {
      await delay(500);
    }
  }

  return results.sort((a, b) => a.year - b.year);
};
