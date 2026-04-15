/**
 * LosslessAPI - React Native Port
 *
 * Changes from web version:
 * - axios replaces fetch() for all HTTP calls
 * - atob/btoa replaced with Buffer (install: @craftzdog/react-native-buffer)
 * - URL.createObjectURL / blob: URLs replaced with base64 data URIs or temp file paths
 * - MediaSource / document DOM APIs replaced with Platform checks
 * - triggerDownload replaced with react-native-fs (RNFS)
 * - loadFfmpeg (WASM) removed — transcode via native FFmpegModule
 * - window.* globals replaced with module-level config
 * - DashDownloader / HlsDownloader replaced with RN-compatible stubs
 *
 * Required dependencies:
 *   yarn add axios @craftzdog/react-native-buffer react-native-fs
 *
 * Optional (for caching):
 *   yarn add @react-native-async-storage/async-storage
 */

import axios from 'axios';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { Buffer } from '@craftzdog/react-native-buffer';
import FFmpegBridge from '@native/FFmpegBridge';

// ---------------------------------------------------------------------------
// Inline stubs for web-only imports that you must replace with your own RN
// implementations or remove if unused.
// ---------------------------------------------------------------------------

// Replace with your own settings/config module
const defaultSettings = {
  getInstances: async type => {
    // Returning the local Flask server proxy
    // return [{ url: 'https://monochrome.tf', version: '1.0' }];
    return [{ url: 'http://192.168.29.180:4000/api', version: '1.0' }];
  },
};

// Replace with your own storage module (e.g. AsyncStorage keys)
const preferDolbyAtmosSettings = { isEnabled: () => false };
const trackDateSettings = { useAlbumYear: () => true };

// Replace with your own HiFiClient (Tidal HiFi wrapper)
// const HiFiClient = {
//   instance: {
//     query: async path => {
//       throw new Error('HiFiClient not configured');
//     },
//   },
// };

// Sentinel class so we can skip caching TidalResponse objects
class TidalResponse {}

// ---------------------------------------------------------------------------
// Utility helpers (replace with your real utils module)
// ---------------------------------------------------------------------------

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const isTrackUnavailable = track =>
  track?.streamingPrivileges === false || track?.isUnavailable === true;

const deriveTrackQuality = track => {
  const modes = track?.audioModes;
  if (Array.isArray(modes) && modes.includes('DOLBY_ATMOS'))
    return 'DOLBY_ATMOS';
  const q = track?.audioQuality;
  if (q) return q;
  return null;
};

const getTrackDiscNumber = track =>
  track?.volumeNumber ?? track?.discNumber ?? 1;

const getExtensionFromBlob = async blob => {
  // React Native: derive from mime type string stored on the blob-like object
  const mime = blob?.type || '';
  if (mime.includes('flac')) return 'flac';
  if (mime.includes('mp4') || mime.includes('m4a')) return 'm4a';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('mpeg') || mime.includes('mp3')) return 'mp3';
  if (mime.includes('video')) return 'mp4';
  return 'flac';
};

const isCustomFormat = quality =>
  ['MP3_320', 'MP3_128', 'OGG_96', 'OGG_320'].includes(quality);

// ---------------------------------------------------------------------------
// Simple in-memory cache (drop-in for APICache)
// For persistence across app restarts, swap Map for AsyncStorage.
// ---------------------------------------------------------------------------

class APICache {
  constructor({ maxSize = 200, ttl = 1000 * 60 * 30 } = {}) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    this._store = new Map(); // key -> { value, expiresAt }
  }

  _key(namespace, id) {
    return `${namespace}::${id}`;
  }

  async get(namespace, id) {
    const entry = this._store.get(this._key(namespace, id));
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this._store.delete(this._key(namespace, id));
      return null;
    }
    return entry.value;
  }

  async set(namespace, id, value) {
    if (this._store.size >= this.maxSize) {
      // Evict oldest entry
      const firstKey = this._store.keys().next().value;
      this._store.delete(firstKey);
    }
    this._store.set(this._key(namespace, id), {
      value,
      expiresAt: Date.now() + this.ttl,
    });
  }

  async clearExpired() {
    const now = Date.now();
    for (const [key, entry] of this._store.entries()) {
      if (now > entry.expiresAt) this._store.delete(key);
    }
  }

  async clear() {
    this._store.clear();
  }

  getCacheStats() {
    return { size: this._store.size, maxSize: this.maxSize };
  }
}

// ---------------------------------------------------------------------------
// Container classes (mirrors web version — keep in sync with your model layer)
// ---------------------------------------------------------------------------

class TrackAlbum {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

class EnrichedAlbum {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

class EnrichedTrack {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

class ReplayGain {
  constructor({
    trackReplayGain,
    trackPeakAmplitude,
    albumReplayGain,
    albumPeakAmplitude,
  } = {}) {
    this.trackReplayGain = trackReplayGain ?? null;
    this.trackPeakAmplitude = trackPeakAmplitude ?? null;
    this.albumReplayGain = albumReplayGain ?? null;
    this.albumPeakAmplitude = albumPeakAmplitude ?? null;
  }
}

class PlaybackInfo {
  constructor(data = {}) {
    this.track = data.track ?? null;
    this.info = data.info ?? null;
    this.originalTrackUrl = data.originalTrackUrl ?? null;
  }
}

class Track {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

class Album {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

class PreparedTrack {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

class PreparedVideo {
  constructor(data = {}) {
    Object.assign(this, data);
  }
}

// ---------------------------------------------------------------------------
// Platform detection (replaces isIos / isSafari web globals)
// ---------------------------------------------------------------------------

const isIos = Platform.OS === 'ios';
// No Safari concept in RN; Android uses its own codec set
const isSafari = false;

// ---------------------------------------------------------------------------
// RN-compatible DASH downloader stub
// Replace the body with your preferred DASH segmented download logic,
// or use a native player (e.g. react-native-video) for playback instead.
// ---------------------------------------------------------------------------

class DashDownloader {
  /**
   * Downloads a DASH stream described by a manifest XML string (NOT a blob: URL).
   * In RN we receive the raw manifest XML; parse segments and download them.
   *
   * @param {string} manifestXml - Raw MPD XML string
   * @param {object} options
   * @param {AbortSignal} [options.signal]
   * @param {Function} [options.onProgress]
   * @returns {Promise<{ path: string, mimeType: string }>}
   */
  async downloadDashStream(manifestXml, options = {}) {
    // TODO: Implement real DASH segment parsing + stitching.
    // For now, throw so the caller falls back to LOSSLESS direct download.
    throw new Error(
      'DashDownloader: not yet implemented for React Native. ' +
        'Use react-native-video for playback or implement MPD segment fetching.',
    );
  }
}

// ---------------------------------------------------------------------------
// RN-compatible HLS downloader stub
// ---------------------------------------------------------------------------

class HlsDownloader {
  /**
   * @param {string} m3u8Url
   * @param {object} options
   * @returns {Promise<{ path: string, mimeType: string }>}
   */
  async downloadHlsStream(m3u8Url, options = {}) {
    throw new Error(
      'HlsDownloader: not yet implemented for React Native. ' +
        'Use react-native-video for HLS playback.',
    );
  }
}

// ---------------------------------------------------------------------------
// Main API class
// ---------------------------------------------------------------------------

export class LosslessAPI {
  /**
   * @param {object} settings - Must expose `getInstances(type): Promise<Array<{url,version}>>`.
   *                            Defaults to `defaultSettings` if omitted.
   */
  constructor(settings = defaultSettings) {
    this.settings = settings;
    this.cache = new APICache({ maxSize: 200, ttl: 1000 * 60 * 30 });
    this.streamCache = new Map();

    this._cacheInterval = setInterval(async () => {
      await this.cache.clearExpired();
      this._pruneStreamCache();
    }, 1000 * 60 * 5);
  }

  /** Call this when the API instance is no longer needed to avoid memory leaks. */
  destroy() {
    clearInterval(this._cacheInterval);
  }

  _pruneStreamCache() {
    if (this.streamCache.size > 50) {
      const entries = Array.from(this.streamCache.entries());
      entries
        .slice(0, entries.length - 50)
        .forEach(([key]) => this.streamCache.delete(key));
    }
  }

  // -------------------------------------------------------------------------
  // Core HTTP
  // -------------------------------------------------------------------------

  /**
   * Performs a GET request against one of the configured API instances with
   * round-robin + retry logic.  Returns the parsed JSON body.
   *
   * Replaces web `fetchWithRetry` which returned a raw Response object;
   * here we return `{ data, status, headers }` from axios so callers can
   * inspect status if needed, but most callers just use `.data`.
   */
  async fetchWithRetry(relativePath, options = {}) {
    const type = options.type || 'api';
    const instanceRoutes = [
      '/track',
      '/album/similar',
      '/artist/similar',
      '/video',
      '/recommendations',
      '/trackManifests',
    ];

    // We don't have a direct HiFiClient, everything goes to the proxy instances.
    let instances = await this.settings.getInstances(type);
    if (instances.length === 0) {
      throw new Error(`No API instances configured for type: ${type}`);
    }

    if (options.minVersion) {
      instances = instances.filter(
        i =>
          i.version && parseFloat(i.version) >= parseFloat(options.minVersion),
      );
      if (instances.length === 0) {
        throw new Error(
          `No API instances with minVersion ${options.minVersion} for type: ${type}`,
        );
      }
    }

    if (options.allowedDomains) {
      instances = instances.filter(i => {
        const url = typeof i === 'string' ? i : i.url;
        return options.allowedDomains.some(d => url.includes(d));
      });
      if (instances.length === 0) {
        throw new Error(
          `No API instances matching allowedDomains for type: ${type}`,
        );
      }
    }

    const maxAttempts = instances.length * 2;
    let lastError = null;
    let idx = Math.floor(Math.random() * instances.length);

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const instance = instances[idx % instances.length];
      const baseUrl = typeof instance === 'string' ? instance : instance.url;
      const url = baseUrl.endsWith('/')
        ? `${baseUrl}${relativePath.substring(1)}`
        : `${baseUrl}${relativePath}`;

      try {
        const axiosConfig = {
          method: 'get',
          url,
          // Map AbortSignal to axios cancelToken when provided
          ...(options.signal ? { signal: options.signal } : {}),
          validateStatus: null, // let us inspect all status codes
        };

        const response = await axios(axiosConfig);
        console.log('RESPONSE', response);
        if (response.status === 429) {
          console.warn(`Rate limit on ${baseUrl}. Trying next instance…`);
          idx++;
          await delay(500);
          continue;
        }

        if (response.status >= 200 && response.status < 300) {
          return {
            data: response.data,
            status: response.status,
            headers: response.headers,
          };
        }

        if (response.status === 401) {
          const sub = response.data?.subStatus;
          if (sub === 11002) {
            console.warn(`Auth failed on ${baseUrl}. Trying next…`);
            idx++;
            continue;
          }
        }

        if (response.status >= 500) {
          console.warn(
            `Server error ${response.status} on ${baseUrl}. Trying next…`,
          );
          idx++;
          continue;
        }

        lastError = new Error(`Request failed with status ${response.status}`);
        idx++;
      } catch (error) {
        if (axios.isCancel(error) || error?.name === 'AbortError') throw error;
        lastError = error;
        console.warn(
          `Network error on ${baseUrl}: ${error.message}. Trying next…`,
        );
        idx++;
        await delay(200);
      }
    }

    throw (
      lastError || new Error(`All API instances failed for: ${relativePath}`)
    );
  }

  // -------------------------------------------------------------------------
  // Search helpers
  // -------------------------------------------------------------------------

  findSearchSection(source, key, visited) {
    if (!source || typeof source !== 'object') return;
    if (Array.isArray(source)) {
      for (const e of source) {
        const f = this.findSearchSection(e, key, visited);
        if (f) return f;
      }
      return;
    }
    if (visited.has(source)) return;
    visited.add(source);
    if ('items' in source && Array.isArray(source.items)) return source;
    if (key in source) {
      const f = this.findSearchSection(source[key], key, visited);
      if (f) return f;
    }
    for (const v of Object.values(source)) {
      const f = this.findSearchSection(v, key, visited);
      if (f) return f;
    }
  }

  buildSearchResponse(section) {
    const items = section?.items ?? [];
    return {
      items,
      limit: section?.limit ?? items.length,
      offset: section?.offset ?? 0,
      totalNumberOfItems: section?.totalNumberOfItems ?? items.length,
    };
  }

  normalizeSearchResponse(data, key) {
    const section = this.findSearchSection(data, key, new Set());
    return this.buildSearchResponse(section);
  }

  // -------------------------------------------------------------------------
  // Data preparation helpers
  // -------------------------------------------------------------------------

  prepareTrack(track) {
    let normalized = track;

    if (track.type && typeof track.type === 'string') {
      const lowType = track.type.toLowerCase();
      if (lowType.includes('video')) normalized = { ...track, type: 'video' };
      else if (lowType.includes('track'))
        normalized = { ...track, type: 'track' };
      else normalized = { ...track, type: lowType };
    }

    if (
      !track.artist &&
      Array.isArray(track.artists) &&
      track.artists.length > 0
    ) {
      normalized = { ...normalized, artist: track.artists[0] };
    }

    const derivedQuality = deriveTrackQuality(normalized);
    if (derivedQuality && normalized.audioQuality !== derivedQuality) {
      normalized = { ...normalized, audioQuality: derivedQuality };
    }

    normalized.isUnavailable = isTrackUnavailable(normalized);

    return normalized.type === 'video'
      ? new PreparedVideo(normalized)
      : new PreparedTrack(normalized);
  }

  prepareAlbum(album) {
    if (
      !album.artist &&
      Array.isArray(album.artists) &&
      album.artists.length > 0
    ) {
      return { ...album, artist: album.artists[0] };
    }
    return album;
  }

  preparePlaylist(playlist) {
    return playlist;
  }

  prepareVideo(video) {
    let normalized = { ...video, type: 'video' };
    if (
      !video.artist &&
      Array.isArray(video.artists) &&
      video.artists.length > 0
    ) {
      normalized.artist = video.artists[0];
    }
    return normalized;
  }

  prepareArtist(artist) {
    if (
      !artist.type &&
      Array.isArray(artist.artistTypes) &&
      artist.artistTypes.length > 0
    ) {
      return { ...artist, type: artist.artistTypes[0] };
    }
    return artist;
  }

  // -------------------------------------------------------------------------
  // Album date enrichment
  // -------------------------------------------------------------------------

  async enrichTracksWithAlbumDates(tracks, maxRequests = 20) {
    if (!trackDateSettings.useAlbumYear()) return tracks;

    const albumIdsToFetch = [];
    for (const track of tracks) {
      if (
        !track.album?.releaseDate &&
        track.album?.id &&
        !albumIdsToFetch.includes(track.album.id)
      ) {
        albumIdsToFetch.push(track.album.id);
      }
    }
    if (albumIdsToFetch.length === 0) return tracks;

    const limitedIds = albumIdsToFetch.slice(0, maxRequests);
    const albumDateMap = new Map();
    const chunkSize = 5;

    for (let i = 0; i < limitedIds.length; i += chunkSize) {
      const chunk = limitedIds.slice(i, i + chunkSize);
      const results = await Promise.allSettled(
        chunk.map(id => this.getAlbum(id)),
      );
      results.forEach((result, j) => {
        if (result.status === 'fulfilled' && result.value.album?.releaseDate) {
          albumDateMap.set(chunk[j], result.value.album.releaseDate);
        }
      });
    }

    return tracks.map(track => {
      if (
        !track.album?.releaseDate &&
        track.album?.id &&
        albumDateMap.has(track.album.id)
      ) {
        return {
          ...track,
          album: {
            ...track.album,
            releaseDate: albumDateMap.get(track.album.id),
          },
        };
      }
      return track;
    });
  }

  // -------------------------------------------------------------------------
  // Track lookup parsing
  // -------------------------------------------------------------------------

  parseTrackLookup(data) {
    const entries = Array.isArray(data) ? data : [data];
    let track, info, originalTrackUrl;

    for (const entry of entries) {
      if (!entry || typeof entry !== 'object') continue;
      if (!track && 'duration' in entry) {
        track = entry;
        continue;
      }
      if (!info && 'manifest' in entry) {
        info = entry;
        continue;
      }
      if (!originalTrackUrl && 'OriginalTrackUrl' in entry) {
        if (typeof entry.OriginalTrackUrl === 'string')
          originalTrackUrl = entry.OriginalTrackUrl;
      }
    }

    if (!track || !info) throw new Error('Malformed track response');
    return { track, info, originalTrackUrl };
  }

  /**
   * Decodes a manifest (base64 string or object) and extracts the best stream URL.
   *
   * WEB CHANGE: atob() replaced with Buffer.from(str, 'base64').toString('utf8').
   * blob: URLs are NOT created — instead returns the raw MPD XML string when the
   * manifest is a DASH manifest, so the caller can handle it natively.
   *
   * @returns {string|null} Direct HTTPS URL, MPD XML string, or null.
   */
  extractStreamUrlFromManifest(manifest) {
    if (!manifest) return null;

    try {
      let decoded;

      if (typeof manifest === 'string') {
        try {
          // RN-safe base64 decode
          decoded = Buffer.from(manifest, 'base64').toString('utf8');
        } catch {
          decoded = manifest;
        }
      } else if (typeof manifest === 'object') {
        if (manifest.urls && Array.isArray(manifest.urls)) {
          return this._pickBestUrl(manifest.urls);
        }
        return null;
      } else {
        return null;
      }

      // DASH manifest: return raw XML (no blob: URL in RN)
      if (decoded.includes('<MPD')) {
        return decoded; // Caller must detect this and route to DashDownloader
      }

      try {
        const parsed = JSON.parse(decoded);
        if (parsed?.urls && Array.isArray(parsed.urls)) {
          return this._pickBestUrl(parsed.urls);
        }
        if (parsed?.urls?.[0]) return parsed.urls[0];
      } catch {
        const match = decoded.match(/https?:\/\/[\w\-.~:?#[@!$&'()*+,;=%/]+/);
        return match ? match[0] : null;
      }
    } catch (error) {
      console.error('Failed to decode manifest:', error);
      return null;
    }

    return null;
  }

  _pickBestUrl(urls) {
    const priority = ['flac', 'lossless', 'hi-res', 'high'];
    return [...urls].sort((a, b) => {
      const aScore = priority.findIndex(k => a.toLowerCase().includes(k));
      const bScore = priority.findIndex(k => b.toLowerCase().includes(k));
      return (aScore === -1 ? 999 : aScore) - (bScore === -1 ? 999 : bScore);
    })[0];
  }

  // -------------------------------------------------------------------------
  // Deduplication
  // -------------------------------------------------------------------------

  deduplicateAlbums(albums) {
    const unique = new Map();
    for (const album of albums) {
      const key = JSON.stringify([album.title, album.numberOfTracks || 0]);
      if (unique.has(key)) {
        const existing = unique.get(key);
        if (album.explicit && !existing.explicit) {
          unique.set(key, album);
          continue;
        }
        if (!album.explicit && existing.explicit) continue;
        const existingTags = existing.mediaMetadata?.tags?.length || 0;
        const newTags = album.mediaMetadata?.tags?.length || 0;
        if (newTags > existingTags) unique.set(key, album);
      } else {
        unique.set(key, album);
      }
    }
    return Array.from(unique.values());
  }

  // -------------------------------------------------------------------------
  // Search
  // -------------------------------------------------------------------------

  async search(query, options = {}) {
    const cached = await this.cache.get('search_all', query);
    if (cached) return cached;

    try {
      const { data } = await this.fetchWithRetry(
        `/search/?q=${encodeURIComponent(query)}`,
        options,
      );

      if (
        data.error ||
        (!data.tracks && !data.artists && !data.albums && !data.data?.tracks)
      ) {
        throw new Error('Fallback to individual searches');
      }

      const extract = key => this.normalizeSearchResponse(data, key);
      const tracksData = extract('tracks');
      const artistsData = extract('artists');
      const albumsData = extract('albums');
      const playlistsData = extract('playlists');
      const videosData = extract('videos');

      const results = {
        tracks: {
          ...tracksData,
          items: tracksData.items.map(t => this.prepareTrack(t)),
        },
        artists: {
          ...artistsData,
          items: artistsData.items.map(a => this.prepareArtist(a)),
        },
        albums: {
          ...albumsData,
          items: albumsData.items.map(a => this.prepareAlbum(a)),
        },
        playlists: playlistsData
          ? {
              ...playlistsData,
              items: playlistsData.items.map(p => this.preparePlaylist(p)),
            }
          : { items: [], limit: 0, offset: 0, totalNumberOfItems: 0 },
        videos: {
          ...videosData,
          items: videosData.items.map(v => this.prepareTrack(v)),
        },
      };

      await this.cache.set('search_all', query, results);
      return results;
    } catch (_error) {
      const [tracks, videos, artists, albums, playlists] = await Promise.all([
        this.searchTracks(query, options).catch(() => ({ items: [] })),
        this.searchVideos(query, options).catch(() => ({ items: [] })),
        this.searchArtists(query, options).catch(() => ({ items: [] })),
        this.searchAlbums(query, options).catch(() => ({ items: [] })),
        this.searchPlaylists(query, options).catch(() => ({ items: [] })),
      ]);
      return { tracks, videos, artists, albums, playlists };
    }
  }

  async searchTracks(query, options = {}) {
    const cached = await this.cache.get('search_tracks', query);
    if (cached) return cached;
    try {
      const { data } = await this.fetchWithRetry(
        `/search/?s=${encodeURIComponent(query)}`,
        options,
      );
      const normalized = this.normalizeSearchResponse(data, 'tracks');
      const result = {
        ...normalized,
        items: normalized.items.map(t => this.prepareTrack(t)),
      };
      await this.cache.set('search_tracks', query, result);
      return result;
    } catch (error) {
      if (axios.isCancel(error) || error?.name === 'AbortError') throw error;
      console.error('Track search failed:', error);
      return { items: [], limit: 0, offset: 0, totalNumberOfItems: 0 };
    }
  }

  async searchArtists(query, options = {}) {
    const cached = await this.cache.get('search_artists', query);
    if (cached) return cached;
    try {
      const { data } = await this.fetchWithRetry(
        `/search/?a=${encodeURIComponent(query)}`,
        options,
      );
      const normalized = this.normalizeSearchResponse(data, 'artists');
      const result = {
        ...normalized,
        items: normalized.items.map(a => this.prepareArtist(a)),
      };
      await this.cache.set('search_artists', query, result);
      return result;
    } catch (error) {
      if (axios.isCancel(error) || error?.name === 'AbortError') throw error;
      console.error('Artist search failed:', error);
      return { items: [], limit: 0, offset: 0, totalNumberOfItems: 0 };
    }
  }

  async searchAlbums(query, options = {}) {
    const cached = await this.cache.get('search_albums', query);
    if (cached) return cached;
    try {
      const { data } = await this.fetchWithRetry(
        `/search/?al=${encodeURIComponent(query)}`,
        options,
      );
      const normalized = this.normalizeSearchResponse(data, 'albums');
      const result = {
        ...normalized,
        items: this.deduplicateAlbums(
          normalized.items.map(a => this.prepareAlbum(a)),
        ),
      };
      await this.cache.set('search_albums', query, result);
      return result;
    } catch (error) {
      if (axios.isCancel(error) || error?.name === 'AbortError') throw error;
      console.error('Album search failed:', error);
      return { items: [], limit: 0, offset: 0, totalNumberOfItems: 0 };
    }
  }

  async searchPlaylists(query, options = {}) {
    const cached = await this.cache.get('search_playlists', query);
    if (cached) return cached;
    try {
      const { data } = await this.fetchWithRetry(
        `/search/?p=${encodeURIComponent(query)}`,
        options,
      );
      const normalized = this.normalizeSearchResponse(data, 'playlists');
      const result = {
        ...normalized,
        items: normalized.items.map(p => this.preparePlaylist(p)),
      };
      await this.cache.set('search_playlists', query, result);
      return result;
    } catch (error) {
      if (axios.isCancel(error) || error?.name === 'AbortError') throw error;
      console.error('Playlist search failed:', error);
      return { items: [], limit: 0, offset: 0, totalNumberOfItems: 0 };
    }
  }

  async searchVideos(query, options = {}) {
    const cached = await this.cache.get('search_videos', query);
    if (cached) return cached;
    try {
      const { data } = await this.fetchWithRetry(
        `/search/?v=${encodeURIComponent(query)}`,
        options,
      );
      const normalized = this.normalizeSearchResponse(data, 'videos');
      const result = {
        ...normalized,
        items: normalized.items.map(v => this.prepareVideo(v)),
      };
      await this.cache.set('search_videos', query, result);
      return result;
    } catch (error) {
      if (axios.isCancel(error) || error?.name === 'AbortError') throw error;
      console.error('Video search failed:', error);
      return { items: [], limit: 0, offset: 0, totalNumberOfItems: 0 };
    }
  }

  // -------------------------------------------------------------------------
  // Video
  // -------------------------------------------------------------------------

  async getVideo(id) {
    const cached = await this.cache.get('video', id);
    if (cached) return cached;

    const { data: jsonResponse } = await this.fetchWithRetry(
      `/video/?id=${id}`,
      { type: 'streaming' },
    );
    const data = jsonResponse.data || jsonResponse;

    const result = {
      track: data,
      info: data,
      originalTrackUrl: data.OriginalTrackUrl || null,
    };

    await this.cache.set('video', id, result);
    return result;
  }

  // -------------------------------------------------------------------------
  // Album
  // -------------------------------------------------------------------------

  async getAlbum(id) {
    const cached = await this.cache.get('album', id);
    if (cached) return cached;

    const { data: jsonData } = await this.fetchWithRetry(`/album/?id=${id}`);
    const data = jsonData.data || jsonData;

    let album, tracksSection;

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if ('numberOfTracks' in data || 'title' in data) {
        album = this.prepareAlbum(data);
      }
      if ('items' in data) {
        tracksSection = data;
        if (!album && data.items?.length > 0) {
          const track = data.items[0].item || data.items[0];
          if (track?.album) album = this.prepareAlbum(track.album);
        }
      }
    }

    if (!album) throw new Error('Album not found');

    if (!album.artist && tracksSection?.items?.length > 0) {
      const track = tracksSection.items[0].item || tracksSection.items[0];
      if (track?.artist) album = { ...album, artist: track.artist };
    }

    if (!album.releaseDate && tracksSection?.items?.length > 0) {
      const track = tracksSection.items[0].item || tracksSection.items[0];
      if (track?.album?.releaseDate)
        album = { ...album, releaseDate: track.album.releaseDate };
      else if (track?.streamStartDate)
        album = { ...album, releaseDate: track.streamStartDate.split('T')[0] };
    }

    let tracks = (tracksSection?.items || []).map(i =>
      this.prepareTrack(i.item || i),
    );

    // Pagination
    if (album.numberOfTracks > tracks.length) {
      let offset = tracks.length;
      const SAFE_MAX = 10000;

      while (tracks.length < album.numberOfTracks && tracks.length < SAFE_MAX) {
        try {
          const { data: nextJson } = await this.fetchWithRetry(
            `/album/?id=${id}&offset=${offset}&limit=500`,
          );
          const nextData = nextJson.data || nextJson;

          let nextItems = nextData.items || [];
          if (!nextItems.length && Array.isArray(nextData)) {
            for (const entry of nextData) {
              if (entry?.items?.length) {
                nextItems = entry.items;
                break;
              }
            }
          }

          if (!nextItems.length) break;

          const prepared = nextItems.map(i => this.prepareTrack(i.item || i));
          if (!prepared.length) break;
          if (tracks.length > 0 && prepared[0].id === tracks[0].id) break;

          tracks = tracks.concat(prepared);
          offset += prepared.length;
        } catch (error) {
          console.error(
            `Error fetching album tracks at offset ${offset}:`,
            error,
          );
          break;
        }
      }
    }

    if (album?.releaseDate) {
      tracks = tracks.map(track => {
        if (track.album && !track.album.releaseDate) {
          return {
            ...track,
            album: { ...track.album, releaseDate: album.releaseDate },
          };
        }
        return track;
      });
    }

    tracks = tracks.map(t => {
      if (t.album) t.album = new TrackAlbum(t.album);
      return new Track(t);
    });

    album = new Album(album);
    const result = { album, tracks };
    await this.cache.set('album', id, result);
    return result;
  }

  // -------------------------------------------------------------------------
  // Playlist
  // -------------------------------------------------------------------------

  async getPlaylist(id) {
    const cached = await this.cache.get('playlist', id);
    if (cached) return cached;

    const { data: jsonData } = await this.fetchWithRetry(`/playlist/?id=${id}`);
    const data = jsonData.data || jsonData;

    let playlist = data.playlist || null;
    let tracksSection = data.items ? { items: data.items } : null;

    if (!playlist || !tracksSection) {
      const entries = Array.isArray(data) ? data : [data];
      for (const entry of entries) {
        if (!entry || typeof entry !== 'object') continue;
        if (
          !playlist &&
          ('uuid' in entry ||
            'numberOfTracks' in entry ||
            ('title' in entry && 'id' in entry))
        ) {
          playlist = entry;
        }
        if (!tracksSection && 'items' in entry) tracksSection = entry;
      }
    }

    if (!playlist) throw new Error('Playlist not found');

    let tracks = (tracksSection?.items || []).map(i =>
      this.prepareTrack(i.item || i),
    );

    if (playlist.numberOfTracks > tracks.length) {
      let offset = tracks.length;
      const SAFE_MAX = 10000;

      while (
        tracks.length < playlist.numberOfTracks &&
        tracks.length < SAFE_MAX
      ) {
        try {
          const { data: nextJson } = await this.fetchWithRetry(
            `/playlist/?id=${id}&offset=${offset}`,
          );
          const nextData = nextJson.data || nextJson;

          let nextItems = nextData.items || [];
          if (!nextItems.length && Array.isArray(nextData)) {
            for (const entry of nextData) {
              if (entry?.items?.length) {
                nextItems = entry.items;
                break;
              }
            }
          }

          if (!nextItems.length) break;
          const prepared = nextItems.map(i => this.prepareTrack(i.item || i));
          if (!prepared.length) break;
          if (tracks.length > 0 && prepared[0].id === tracks[0].id) break;

          tracks = tracks.concat(prepared);
          offset += prepared.length;
        } catch (error) {
          console.error(
            `Error fetching playlist tracks at offset ${offset}:`,
            error,
          );
          break;
        }
      }
    }

    tracks = tracks.map(t => {
      if (t.album) t.album = new TrackAlbum(t.album);
      return new Track(t);
    });

    const result = { playlist, tracks };
    await this.cache.set('playlist', id, result);
    return result;
  }

  // -------------------------------------------------------------------------
  // Mix
  // -------------------------------------------------------------------------

  async getMix(id) {
    const cached = await this.cache.get('mix', id);
    if (cached) return cached;

    const { data } = await this.fetchWithRetry(`/mix/?id=${id}`, {
      type: 'api',
      minVersion: '2.3',
    });
    const mixData = data.mix;
    const items = data.items || [];

    if (!mixData) throw new Error('Mix metadata not found');

    let tracks = items.map(i => this.prepareTrack(i.item || i));
    tracks = await this.enrichTracksWithAlbumDates(tracks, 10);
    tracks = tracks.map(t => {
      if (t.album) t.album = new TrackAlbum(t.album);
      return new Track(t);
    });

    const mix = {
      id: mixData.id,
      title: mixData.title,
      subTitle: mixData.subTitle,
      description: mixData.description,
      mixType: mixData.mixType,
      cover:
        mixData.images?.LARGE?.url ||
        mixData.images?.MEDIUM?.url ||
        mixData.images?.SMALL?.url ||
        null,
    };

    const result = { mix, tracks };
    await this.cache.set('mix', id, result);
    return result;
  }

  // -------------------------------------------------------------------------
  // Artist
  // -------------------------------------------------------------------------

  async getArtistSocials(artistName) {
    const cacheKey = `artist_socials_${artistName}`;
    const cached = await this.cache.get('artist', cacheKey);
    if (cached) return cached;

    try {
      const searchRes = await axios.get(
        `https://musicbrainz.org/ws/2/artist/?query=artist:${encodeURIComponent(
          artistName,
        )}&fmt=json`,
        {
          headers: {
            'User-Agent': 'YourApp/1.0.0 ( https://your-app.example.com )',
          },
        },
      );
      const searchData = searchRes.data;
      if (!searchData.artists?.length) return [];

      const mbid = searchData.artists[0].id;
      const detailsRes = await axios.get(
        `https://musicbrainz.org/ws/2/artist/${mbid}?inc=url-rels&fmt=json`,
        {
          headers: {
            'User-Agent': 'YourApp/1.0.0 ( https://your-app.example.com )',
          },
        },
      );
      const detailsData = detailsRes.data;

      const allowedTypes = [
        'social network',
        'streaming',
        'official homepage',
        'youtube',
        'soundcloud',
        'bandcamp',
      ];
      const links = (detailsData.relations || [])
        .filter(rel => allowedTypes.includes(rel.type))
        .map(rel => ({ type: rel.type, url: rel.url.resource }));

      await this.cache.set('artist', cacheKey, links);
      return links;
    } catch (e) {
      console.warn('Failed to fetch artist socials:', e);
      return [];
    }
  }

  async getArtist(artistId, options = {}) {
    const cacheKey = options.lightweight
      ? `artist_${artistId}_light`
      : `artist_${artistId}`;
    if (!options.skipCache) {
      const cached = await this.cache.get('artist', cacheKey);
      if (cached) return cached;
    }

    const [primaryRes, contentRes] = await Promise.all([
      this.fetchWithRetry(`/artist/?id=${artistId}`),
      this.fetchWithRetry(`/artist/?f=${artistId}&skip_tracks=true`),
    ]);

    const primaryData = primaryRes.data?.data || primaryRes.data;
    const rawArtist =
      primaryData.artist ||
      (Array.isArray(primaryData) ? primaryData[0] : primaryData);
    if (!rawArtist) throw new Error('Primary artist details not found.');

    const artist = {
      ...this.prepareArtist(rawArtist),
      picture: rawArtist.picture || primaryData.cover || null,
      name: rawArtist.name || 'Unknown Artist',
    };

    const contentData = contentRes.data?.data || contentRes.data;
    const entries = Array.isArray(contentData) ? contentData : [contentData];

    const albumMap = new Map(),
      trackMap = new Map(),
      videoMap = new Map();
    const isTrackObj = v => v?.id && v.duration;
    const isAlbumObj = v => v?.id && 'numberOfTracks' in v;
    const isVideoObj = v => v?.id && !!v.type?.toLowerCase().includes('video');

    const scan = (value, visited) => {
      if (!value || typeof value !== 'object' || visited.has(value)) return;
      visited.add(value);
      if (Array.isArray(value)) {
        value.forEach(item => scan(item, visited));
        return;
      }
      const item = value.item || value;
      if (isAlbumObj(item)) albumMap.set(item.id, this.prepareAlbum(item));
      if (isTrackObj(item) && !isAlbumObj(item) && !isVideoObj(item))
        trackMap.set(item.id, this.prepareTrack(item));
      if (isVideoObj(item)) videoMap.set(item.id, this.prepareVideo(item));
      Object.values(value).forEach(nested => scan(nested, visited));
    };

    const visited = new Set();
    entries.forEach(e => scan(e, visited));
    scan(primaryData, visited);

    const matchesArtist = item => {
      const ids = [
        item.artist?.id,
        ...(Array.isArray(item.artists) ? item.artists.map(a => a.id) : []),
      ].filter(Boolean);
      return ids.some(id => Number(id) === Number(artistId));
    };

    if (!options.lightweight) {
      try {
        const videoSearch = await this.searchVideos(artist.name);
        for (const item of videoSearch.items || []) {
          if (matchesArtist(item) && !videoMap.has(item.id))
            videoMap.set(item.id, item);
        }
      } catch (e) {
        console.warn('Failed to fetch additional videos via search:', e);
      }
    }

    const rawReleases = Array.from(albumMap.values()).filter(matchesArtist);
    const allReleases = this.deduplicateAlbums(rawReleases).sort(
      (a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0),
    );

    const eps = allReleases.filter(a => a.type === 'EP' || a.type === 'SINGLE');
    const albums = allReleases.filter(a => !eps.includes(a));

    const topTracks = Array.from(trackMap.values())
      .filter(matchesArtist)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 15);

    const videos = Array.from(videoMap.values()).sort(
      (a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0),
    );

    const tracks = options.lightweight
      ? topTracks
      : await this.enrichTracksWithAlbumDates(topTracks);
    const result = { ...artist, albums, eps, tracks, videos };

    await this.cache.set('artist', cacheKey, result);
    return result;
  }

  async getSimilarArtists(artistId) {
    const cached = await this.cache.get('similar_artists', artistId);
    if (cached) return cached;
    try {
      const { data } = await this.fetchWithRetry(
        `/artist/similar/?id=${artistId}`,
        { type: 'api', minVersion: '2.3' },
      );
      const items =
        data.artists ||
        data.items ||
        data.data ||
        (Array.isArray(data) ? data : []);
      const result = items.map(a => this.prepareArtist(a));
      await this.cache.set('similar_artists', artistId, result);
      return result;
    } catch (e) {
      console.warn('Failed to fetch similar artists:', e);
      return [];
    }
  }

  async getSimilarAlbums(albumId) {
    const cached = await this.cache.get('similar_albums', albumId);
    if (cached) return cached;
    try {
      const { data } = await this.fetchWithRetry(
        `/album/similar/?id=${albumId}`,
        { type: 'api', minVersion: '2.3' },
      );
      const items =
        data.items ||
        data.albums ||
        data.data ||
        (Array.isArray(data) ? data : []);
      const result = items.map(a => this.prepareAlbum(a));
      await this.cache.set('similar_albums', albumId, result);
      return result;
    } catch (e) {
      console.warn('Failed to fetch similar albums:', e);
      return [];
    }
  }

  async getArtistBiography(artistId) {
    const cacheKey = `artist_bio_v1_${artistId}`;
    const cached = await this.cache.get('artist', cacheKey);
    if (cached) return cached;
    // try {
    //   const res = await HiFiClient.instance.query(
    //     `/artist/bio/?id=${artistId}`,
    //   );
    //   const json = typeof res.json === 'function' ? await res.json() : res;
    //   if (json?.data?.text) {
    //     const bio = {
    //       text: json.data.text,
    //       source: json.data.source || 'Tidal',
    //     };
    //     await this.cache.set('artist', cacheKey, bio);
    //     return bio;
    //   }
    // } catch (e) {
    //   console.warn('Failed to fetch biography:', e);
    // }
    return null;
  }

  // -------------------------------------------------------------------------
  // Track
  // -------------------------------------------------------------------------

  normalizeTrackResponse(apiResponse) {
    if (!apiResponse || typeof apiResponse !== 'object') return apiResponse;
    const raw = apiResponse.data ?? apiResponse;
    const trackStub = { duration: raw.duration ?? 0, id: raw.trackId ?? null };
    return [trackStub, raw];
  }

  async getTrackMetadata(id) {
    const cacheKey = `meta_${id}`;
    const cached = await this.cache.get('track', cacheKey);
    if (cached) return cached;

    const { data: json } = await this.fetchWithRetry(`/info/?id=${id}`, {
      type: 'api',
    });
    const data = json.data || json;
    const items = Array.isArray(data) ? data : [data];
    const found = items.find(i => i.id == id || (i.item && i.item.id == id));

    if (found) {
      const track = this.prepareTrack(found.item || found);
      await this.cache.set('track', cacheKey, track);
      return track;
    }
    throw new Error('Track metadata not found');
  }

  async getTrackRecommendations(id) {
    const cached = await this.cache.get('recommendations', id);
    if (cached) return cached;
    try {
      const { data: json } = await this.fetchWithRetry(
        `/recommendations/?id=${id}`,
        { type: 'api', minVersion: '2.4' },
      );
      const data = json.data || json;
      const tracks = (data.items || []).map(item =>
        this.prepareTrack(item.track || item),
      );
      await this.cache.set('recommendations', id, tracks);
      return tracks;
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
      return [];
    }
  }

  async getTrack(id, quality = 'HI_RES_LOSSLESS') {
    const cacheKey = `${id}_${quality}`;
    const cached = await this.cache.get('track', cacheKey);
    if (cached) return cached;

    const { data: jsonResponse } = await this.fetchWithRetry(
      `/track/?id=${id}&quality=${quality}`,
      { type: 'streaming' },
    );
    const result = this.parseTrackLookup(
      this.normalizeTrackResponse(jsonResponse),
    );
    await this.cache.set('track', cacheKey, result);
    return result;
  }

  // -------------------------------------------------------------------------
  // Stream URL resolution
  // -------------------------------------------------------------------------

  /**
   * Resolves the best available stream URL for a track.
   *
   * WEB CHANGE: Dolby Atmos codec detection replaced with a simple Platform check.
   * Returns { url: string, rgInfo: object }.
   */
  async getStreamUrl(id, quality = 'HI_RES_LOSSLESS', download = false) {
    const cacheKey = `stream_info_${id}_${quality}`;
    if (this.streamCache.has(cacheKey)) return this.streamCache.get(cacheKey);

    let streamUrl,
      manifestRgInfo = null,
      isUsingManifestEndpoint = false;

    try {
      const manifestType = isIos ? 'HLS' : 'MPEG_DASH';
      // RN: assume Atmos capable on modern devices; adjust per your requirements
      const canPlayAtmos = Platform.OS === 'ios' || Platform.OS === 'android';

      const paramsArray = [];

      if (quality === 'LOW') {
        paramsArray.push(['formats', 'HEAACV1']);
      } else if (quality === 'HIGH') {
        paramsArray.push(['formats', 'HEAACV1'], ['formats', 'AACLC']);
      } else if (quality === 'LOSSLESS') {
        paramsArray.push(
          ['formats', 'HEAACV1'],
          ['formats', 'AACLC'],
          ['formats', 'FLAC'],
        );
      } else if (quality === 'HI_RES_LOSSLESS') {
        paramsArray.push(
          ['formats', 'HEAACV1'],
          ['formats', 'AACLC'],
          ['formats', 'FLAC_HIRES'],
          ['formats', 'FLAC'],
        );
      } else if (quality === 'DOLBY_ATMOS' && (canPlayAtmos || download)) {
        paramsArray.push(['formats', 'EAC3_JOC']);
      } else {
        paramsArray.push(
          ['formats', 'HEAACV1'],
          ['formats', 'AACLC'],
          ['formats', 'FLAC'],
          ['formats', 'FLAC_HIRES'],
        );
        if (canPlayAtmos || download) paramsArray.push(['formats', 'EAC3_JOC']);
      }

      paramsArray.push(
        ['adaptive', 'true'],
        ['manifestType', manifestType],
        ['uriScheme', 'HTTPS'],
        ['usage', 'PLAYBACK'],
      );

      const params = new URLSearchParams(paramsArray);
      const { data: jsonResponse } = await this.fetchWithRetry(
        `/trackManifests/?id=${id}&${params.toString()}`,
        { type: 'streaming', minVersion: '2.7' },
      );

      const url = jsonResponse?.data?.data?.attributes?.uri;
      if (url) {
        streamUrl = url;
        manifestRgInfo = {
          trackReplayGain:
            jsonResponse?.data?.data?.attributes?.trackAudioNormalizationData
              ?.replayGain,
          trackPeakAmplitude:
            jsonResponse?.data?.data?.attributes?.trackAudioNormalizationData
              ?.peakAmplitude,
          albumReplayGain:
            jsonResponse?.data?.data?.attributes?.albumAudioNormalizationData
              ?.replayGain,
          albumPeakAmplitude:
            jsonResponse?.data?.data?.attributes?.albumAudioNormalizationData
              ?.peakAmplitude,
        };
        isUsingManifestEndpoint = true;
      } else {
        throw new Error('No URI in trackManifests response');
      }
    } catch (_err) {
      // Fallback to /track endpoint
    }

    if (!isUsingManifestEndpoint) {
      const lookup = await this.getTrack(id, quality);
      streamUrl =
        lookup.originalTrackUrl ||
        this.extractStreamUrlFromManifest(lookup.info.manifest);
      if (!streamUrl) throw new Error('Could not resolve stream URL');
      if (lookup.info) {
        manifestRgInfo = {
          trackReplayGain:
            lookup.info.trackReplayGain || lookup.info.replayGain,
          trackPeakAmplitude:
            lookup.info.trackPeakAmplitude || lookup.info.peakAmplitude,
          albumReplayGain: lookup.info.albumReplayGain,
          albumPeakAmplitude: lookup.info.albumPeakAmplitude,
        };
      }
    }

    const result = { url: streamUrl, rgInfo: manifestRgInfo };
    this.streamCache.set(cacheKey, result);
    return result;
  }

  async getVideoStreamUrl(id) {
    const cacheKey = `video_stream_${id}`;
    if (this.streamCache.has(cacheKey)) return this.streamCache.get(cacheKey);

    const lookup = await this.getVideo(id);

    const findValue = (obj, key) => {
      if (!obj || typeof obj !== 'object') return null;
      if (obj[key]) return obj[key];
      for (const v of Object.values(obj)) {
        const f = findValue(v, key);
        if (f) return f;
      }
      return null;
    };

    const manifest =
      findValue(lookup, 'manifest') || findValue(lookup, 'Manifest');
    let streamUrl = manifest
      ? this.extractStreamUrlFromManifest(manifest)
      : null;

    if (!streamUrl) {
      streamUrl =
        findValue(lookup, 'OriginalTrackUrl') ||
        findValue(lookup, 'originalTrackUrl') ||
        findValue(lookup, 'url') ||
        findValue(lookup, 'streamUrl') ||
        findValue(lookup, 'manifestUrl');
    }

    if (!streamUrl)
      throw new Error(`Could not resolve video stream URL for ID: ${id}`);
    this.streamCache.set(cacheKey, streamUrl);
    return streamUrl;
  }

  // -------------------------------------------------------------------------
  // Track enrichment
  // -------------------------------------------------------------------------

  async enrichTrack(input, { downloadQuality = 'HI_RES_LOSSLESS' }) {
    if (
      downloadQuality === 'DOLBY_ATMOS' &&
      !input?.audioModes?.includes('DOLBY_ATMOS')
    ) {
      downloadQuality = 'LOSSLESS';
    }

    const id = input?.id || input;
    const track =
      typeof input === 'object'
        ? input
        : await this.getTrack(id, downloadQuality);
    const isVideo = track?.type?.toLowerCase().includes('video');
    if (isCustomFormat(downloadQuality)) downloadQuality = 'LOSSLESS';

    const lookup = isVideo
      ? await this.getVideo(id)
      : new PlaybackInfo(await this.getTrack(id, downloadQuality));

    if (input instanceof EnrichedTrack)
      return { lookup, enrichedTrack: input, isVideo };

    const enrichedTrack = { ...this.prepareTrack(track) };

    if (lookup.info) {
      enrichedTrack.replayGain = new ReplayGain({
        trackReplayGain: lookup.info.trackReplayGain,
        trackPeakAmplitude: lookup.info.trackPeakAmplitude,
        albumReplayGain: lookup.info.albumReplayGain,
        albumPeakAmplitude: lookup.info.albumPeakAmplitude,
      });
    }

    if (
      track.album?.id &&
      (track.album?.totalDiscs == null ||
        track.album?.numberOfTracksOnDisc == null)
    ) {
      try {
        const albumData = await this.getAlbum(track.album.id);
        enrichedTrack.album = new EnrichedAlbum({
          ...albumData.album,
          ...enrichedTrack.album,
        });

        if (albumData.tracks?.length > 0) {
          const discTrackCounts = new Map();
          let maxDisc = 0;
          for (const t of albumData.tracks) {
            const dn = getTrackDiscNumber(t);
            discTrackCounts.set(dn, (discTrackCounts.get(dn) || 0) + 1);
            if (dn > maxDisc) maxDisc = dn;
          }
          const totalDiscs = maxDisc || 1;
          const discNumber = getTrackDiscNumber(track);
          enrichedTrack.album = new EnrichedAlbum({
            ...(enrichedTrack.album || {}),
            totalDiscs: track.album?.totalDiscs ?? totalDiscs,
            numberOfTracksOnDisc:
              track.album?.numberOfTracksOnDisc ??
              discTrackCounts.get(discNumber),
          });
        }
      } catch (e) {
        console.warn('Failed to fetch album for disc info:', e);
      }
    }

    if (!(enrichedTrack.album instanceof EnrichedAlbum)) {
      enrichedTrack.album = new TrackAlbum(enrichedTrack.album);
    }

    return { lookup, enrichedTrack: new EnrichedTrack(enrichedTrack), isVideo };
  }

  // -------------------------------------------------------------------------
  // Download
  //
  // WEB CHANGES:
  //   - triggerDownload()   → RNFS.downloadFile() / RNFS.writeFile()
  //   - Blob construction   → File written to RNFS.DocumentDirectoryPath
  //   - loadFfmpeg (WASM)   → native FFmpegModule (via FFmpegBridge)
  //   - blob: DASH URLs     → raw MPD XML string passed to DashDownloader
  //   - applyAudioPostProcessing → native FFmpegModule transcode
  // -------------------------------------------------------------------------

  /**
   * Downloads a track or video, saves it to the device's document directory,
   * and returns the local file path.
   *
   * @param {string|number} id          - Track/video ID
   * @param {string}        quality     - e.g. 'HI_RES_LOSSLESS'
   * @param {string}        filename    - Desired filename (with extension)
   * @param {object}        options
   * @param {Function}      [options.onProgress]     - ({ loaded, total, stage }) => void
   * @param {object}        [options.track]          - Track metadata for tagging
   * @param {AbortSignal}   [options.signal]         - Cancellation signal
   * @param {boolean}       [options.saveToFiles]    - Save to Files app on iOS (default: true)
   *
   * @returns {Promise<string>}  Absolute path to the saved file.
   */
  async downloadTrack(id, quality = 'HI_RES_LOSSLESS', filename, options = {}) {
    const { onProgress, track } = options;

    let downloadQuality = isCustomFormat(quality) ? 'LOSSLESS' : quality;

    const { lookup, enrichedTrack, isVideo } = await this.enrichTrack(
      track || { id },
      { downloadQuality },
    );

    let streamUrl;
    let postProcessingQuality = lookup.info?.audioQuality ?? null;

    if (lookup.originalTrackUrl) {
      streamUrl = lookup.originalTrackUrl;
    } else {
      const findValue = (obj, key) => {
        if (!obj || typeof obj !== 'object') return null;
        if (obj[key]) return obj[key];
        for (const v of Object.values(obj)) {
          const f = findValue(v, key);
          if (f) return f;
        }
        return null;
      };

      const manifest = isVideo
        ? findValue(lookup, 'manifest') || findValue(lookup, 'Manifest')
        : lookup.info?.manifest;

      if (!manifest) throw new Error('Could not resolve manifest');

      // Dolby Atmos override
      if (
        preferDolbyAtmosSettings.isEnabled() &&
        track?.audioModes?.includes('DOLBY_ATMOS')
      ) {
        try {
          const stream = await this.getStreamUrl(id, 'DOLBY_ATMOS', true);
          // In RN we GET the manifest text via axios
          const manifestRes = await axios.get(stream.url, {
            responseType: 'text',
            signal: options.signal,
          });
          const extracted = this.extractStreamUrlFromManifest(
            Buffer.from(manifestRes.data).toString('base64'),
          );
          if (extracted) {
            streamUrl = extracted;
            postProcessingQuality = 'DOLBY_ATMOS';
          }
        } catch (err) {
          console.error('Failed to extract Dolby Atmos stream URL:', err);
        }
      }

      if (!streamUrl) {
        streamUrl = this.extractStreamUrlFromManifest(manifest);
        if (!streamUrl) throw new Error('Could not resolve stream URL');
      }
    }

    // Determine destination path
    const destDir =
      options.saveToFiles !== false
        ? RNFS.DocumentDirectoryPath
        : RNFS.CachesDirectoryPath;
    const safeName = filename.replace(/[/\\?%*:|"<>]/g, '_');
    let destPath = `${destDir}/${safeName}`;

    // --- DASH stream (MPD XML string) ---
    if (
      typeof streamUrl === 'string' &&
      streamUrl.trimStart().startsWith('<MPD')
    ) {
      try {
        const downloader = new DashDownloader();
        const result = await downloader.downloadDashStream(streamUrl, {
          signal: options.signal,
          onProgress,
        });
        destPath = result.path;
      } catch (dashError) {
        console.error('DASH download failed:', dashError);
        if (isVideo) throw dashError;
        if (downloadQuality !== 'LOSSLESS') {
          return this.downloadTrack(id, 'LOSSLESS', filename, options);
        }
        throw dashError;
      }
    }
    // --- HLS stream ---
    else if (
      streamUrl.includes('.m3u8') ||
      streamUrl.includes('application/vnd.apple.mpegurl')
    ) {
      try {
        const downloader = new HlsDownloader();
        const result = await downloader.downloadHlsStream(streamUrl, {
          signal: options.signal,
          onProgress,
        });
        destPath = result.path;
      } catch (hlsError) {
        console.error('HLS download failed:', hlsError);
        throw hlsError;
      }
    }
    // --- Direct HTTP download via RNFS ---
    else {
      onProgress?.({ stage: 'downloading', loaded: 0, total: undefined });

      await RNFS.downloadFile({
        fromUrl: streamUrl,
        toFile: destPath,
        progress: res => {
          onProgress?.({
            stage: 'downloading',
            loaded: res.bytesWritten,
            total: res.contentLength,
          });
        },
        progressDivider: 1,
        // Pass abort signal via background flag (RNFS does not natively support AbortSignal;
        // wrap in a jobId-based cancel if you need true cancellation)
      }).promise;
    }

    // --- Post-processing (transcoding via native FFmpegModule) ---
    if (!isVideo && isCustomFormat(quality)) {
      onProgress?.({ stage: 'transcoding' });
      destPath = await this._transcodeWithNativeFFmpeg(
        destPath,
        quality,
        options.signal,
      );
    }

    // --- Metadata tagging ---
    if (track) {
      onProgress?.({ stage: 'tagging' });
      // Wire up your RN metadata tagger here (e.g. id3-writer or a native module).
      // destPath = await addMetadataToFile(destPath, enrichedTrack, quality);
      console.warn('Metadata tagging not implemented. Wire up your RN tagger.');
    }

    onProgress?.({ stage: 'done', path: destPath });
    return destPath;
  }

  /**
   * Transcodes a file using the native FFmpegModule.
   * No third-party JS package needed — uses FFmpegBridge (native module).
   *
   * @param {string} inputPath
   * @param {string} quality  - Custom format key (e.g. 'MP3_320')
   * @returns {Promise<string>} Output file path
   */
  async _transcodeWithNativeFFmpeg(inputPath, quality, _signal) {
    try {
      const formatMap = {
        MP3_320: { codec: 'libmp3lame', bitrate: '320k', ext: 'mp3' },
        MP3_128: { codec: 'libmp3lame', bitrate: '128k', ext: 'mp3' },
        OGG_96: { codec: 'libvorbis', bitrate: '96k', ext: 'ogg' },
        OGG_320: { codec: 'libvorbis', bitrate: '320k', ext: 'ogg' },
      };

      const fmt = formatMap[quality];
      if (!fmt) throw new Error(`Unknown custom format: ${quality}`);

      // Native module handles transcoding + source file cleanup
      const outputPath = await FFmpegBridge.transcode(
        inputPath,
        fmt.codec,
        fmt.bitrate,
        fmt.ext,
      );

      return outputPath;
    } catch (e) {
      console.error('Transcoding failed:', e);
      return inputPath; // Return original if transcoding fails
    }
  }

  // -------------------------------------------------------------------------
  // Image URL helpers (unchanged — all return HTTPS URLs, RN-safe)
  // -------------------------------------------------------------------------

  getCoverUrl(id, size = '320') {
    if (!id) return `https://picsum.photos/seed/${Math.random()}/${size}`;
    if (
      typeof id === 'string' &&
      (id.startsWith('http') || id.startsWith('assets/'))
    )
      return id;
    return `https://resources.tidal.com/images/${String(id).replace(
      /-/g,
      '/',
    )}/${size}x${size}.jpg`;
  }

  getCoverSrcset(id) {
    if (!id || (typeof id === 'string' && id.startsWith('http'))) return '';
    const base = `https://resources.tidal.com/images/${String(id).replace(
      /-/g,
      '/',
    )}`;
    return `${base}/160x160.jpg 160w, ${base}/320x320.jpg 320w, ${base}/640x640.jpg 640w`;
  }

  getArtistPictureUrl(id, size = '320') {
    if (!id) return `https://picsum.photos/seed/${Math.random()}/${size}`;
    if (typeof id === 'string' && id.startsWith('assets/')) return id;
    return `https://resources.tidal.com/images/${String(id).replace(
      /-/g,
      '/',
    )}/${size}x${size}.jpg`;
  }

  getArtistPictureSrcset(id) {
    if (!id || (typeof id === 'string' && id.startsWith('assets/'))) return '';
    const base = `https://resources.tidal.com/images/${String(id).replace(
      /-/g,
      '/',
    )}`;
    return `${base}/160x160.jpg 160w, ${base}/320x320.jpg 320w, ${base}/640x640.jpg 640w`;
  }

  getVideoCoverUrl(imageId, size = '1280') {
    if (!imageId) return null;
    if (typeof imageId === 'string' && imageId.startsWith('http'))
      return imageId;
    return `https://resources.tidal.com/images/${String(imageId).replace(
      /-/g,
      '/',
    )}/${size}x720.jpg`;
  }

  // -------------------------------------------------------------------------
  // Cache management
  // -------------------------------------------------------------------------

  async clearCache() {
    await this.cache.clear();
    this.streamCache.clear();
  }

  getCacheStats() {
    return { ...this.cache.getCacheStats(), streamUrls: this.streamCache.size };
  }
}

export const losslessApi = new LosslessAPI();
