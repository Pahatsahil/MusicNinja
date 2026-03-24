import { useCallback, useEffect, useState } from 'react';
import { 
  getDBConnection, 
  createTable, 
  getDownloadedTracks, 
  getTrackById, 
  saveDownloadedTrack, 
  deleteTrackFromDb,
  IDownloadedTrack 
} from '@utills/database/schema';
import * as RNFS from 'react-native-fs'

const useDownloadedTracks = () => {
  const [tracks, setTracks] = useState<IDownloadedTrack[]>([]);

  const refreshTracks = useCallback(async () => {
    try {
      const db = await getDBConnection();
      await createTable(db);
      const storedTracks = await getDownloadedTracks(db);
      setTracks(storedTracks);
    } catch (error) {
      console.error('Failed to load tracks from SQLite:', error);
    }
  }, []);

  useEffect(() => {
    refreshTracks();
  }, [refreshTracks]);

  /**
   * Returns cached file path for a video_id, or null if not cached.
   */
  const getCachedPath = useCallback(async (video_id: string): Promise<string | null> => {
    try {
      const db = await getDBConnection();
      await createTable(db);
      
      const track = await getTrackById(db, video_id);
      console.log('track', track);
      if (track && track.filePath) {
        // Verify the file still exists on disk
        const exists = await RNFS.exists(track.filePath);
        console.log('exists', exists);
        if (exists) return track.filePath;
        
        // File was deleted from disk — purge stale record
        await deleteTrackFromDb(db, video_id);
        refreshTracks();
      }
    } catch (error) {
      console.error('getCachedPath error:', error);
    }
    return null;
  }, [refreshTracks]);

  /**
   * Save a downloaded track path into SQLite.
   */
  const saveTrack = useCallback(async (song: {
    video_id: string;
    title: string;
    channelTitle?: string;
    thumbnail?: string;
  }, filePath: string) => {
    try {
      const db = await getDBConnection();
      await createTable(db);
      
      const newTrack: IDownloadedTrack = {
        video_id: song.video_id,
        title: song.title || '',
        channelTitle: song.channelTitle || '',
        thumbnail: song.thumbnail || '',
        filePath,
        downloadedAt: Date.now(),
      };
      
      await saveDownloadedTrack(db, newTrack);
      await refreshTracks();
    } catch (error) {
      console.error('saveTrack error:', error);
    }
  }, [refreshTracks]);

  /**
   * Remove a track from cache (and optionally delete the file).
   */
  const removeTrack = useCallback(async (video_id: string, deleteFile = false) => {
    try {
      const db = await getDBConnection();
      await createTable(db);
      
      const track = await getTrackById(db, video_id);
      
      if (track) {
        if (deleteFile) {
          try {
            const RNFS = require('react-native-fs').default;
            await RNFS.unlink(track.filePath);
          } catch (_) {}
        }
        await deleteTrackFromDb(db, video_id);
        await refreshTracks();
      }
    } catch (error) {
      console.error('removeTrack error:', error);
    }
  }, [refreshTracks]);

  return { tracks, getCachedPath, saveTrack, removeTrack, refreshTracks };
};

export default useDownloadedTracks;
export type { IDownloadedTrack };
