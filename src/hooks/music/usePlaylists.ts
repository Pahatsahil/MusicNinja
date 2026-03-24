import { useCallback, useEffect, useState } from 'react';
import {
  getDBConnection,
  createTable,
  getPlaylists,
  createPlaylist,
  deletePlaylist,
  renamePlaylist,
  getPlaylistTracks,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  IPlaylist,
  IPlaylistTrack,
} from '@utills/database/schema';

const usePlaylists = () => {
  const [playlists, setPlaylists] = useState<IPlaylist[]>([]);

  const refreshPlaylists = useCallback(async () => {
    try {
      const db = await getDBConnection();
      await createTable(db);
      const data = await getPlaylists(db);
      setPlaylists(data);
    } catch (error) {
      console.error('usePlaylists refreshPlaylists:', error);
    }
  }, []);

  useEffect(() => {
    refreshPlaylists();
  }, [refreshPlaylists]);

  const addPlaylist = useCallback(async (name: string) => {
    try {
      if (!name.trim()) return;
      const db = await getDBConnection();
      await createTable(db);
      await createPlaylist(db, name.trim());
      await refreshPlaylists();
    } catch (error) {
      console.error('addPlaylist error:', error);
    }
  }, [refreshPlaylists]);

  const removePlaylist = useCallback(async (playlistId: number) => {
    try {
      const db = await getDBConnection();
      await deletePlaylist(db, playlistId);
      await refreshPlaylists();
    } catch (error) {
      console.error('removePlaylist error:', error);
    }
  }, [refreshPlaylists]);

  const editPlaylistName = useCallback(async (playlistId: number, name: string) => {
    try {
      const db = await getDBConnection();
      await renamePlaylist(db, playlistId, name);
      await refreshPlaylists();
    } catch (error) {
      console.error('editPlaylistName error:', error);
    }
  }, [refreshPlaylists]);

  const fetchTracks = useCallback(async (playlistId: number): Promise<IPlaylistTrack[]> => {
    try {
      const db = await getDBConnection();
      return await getPlaylistTracks(db, playlistId);
    } catch (error) {
      console.error('fetchTracks error:', error);
      return [];
    }
  }, []);

  const addTrack = useCallback(async (
    playlistId: number,
    track: { video_id: string; title: string; channelTitle: string; thumbnail: string; filePath: string },
  ) => {
    try {
      const db = await getDBConnection();
      await addTrackToPlaylist(db, playlistId, track);
      await refreshPlaylists();
    } catch (error) {
      console.error('addTrack error:', error);
    }
  }, [refreshPlaylists]);

  const removeTrack = useCallback(async (playlistId: number, video_id: string) => {
    try {
      const db = await getDBConnection();
      await removeTrackFromPlaylist(db, playlistId, video_id);
    } catch (error) {
      console.error('removeTrack error:', error);
    }
  }, []);

  return {
    playlists,
    refreshPlaylists,
    addPlaylist,
    removePlaylist,
    editPlaylistName,
    fetchTracks,
    addTrack,
    removeTrack,
  };
};

export default usePlaylists;
export type { IPlaylist, IPlaylistTrack };
