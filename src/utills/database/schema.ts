import SQLite from 'react-native-sqlite-storage';

export interface IPlaylist {
  id: number;
  name: string;
  createdAt: number;
  trackCount?: number;
}

export interface IPlaylistTrack {
  id: number;
  playlist_id: number;
  video_id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  filePath: string;
  addedAt: number;
}

SQLite.enablePromise(true);

const database_name = 'MusicNinja.db';
const database_version = '1.0';
const database_displayname = 'Music Ninja SQLite DB';
const database_size = 200000;

export interface IDownloadedTrack {
  video_id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  filePath: string;
  downloadedAt: number;
}

export const getDBConnection = async () => {
  return SQLite.openDatabase(
    {name:database_name},
    // database_version,
    // database_displayname,
    // database_size
  );
};

export const createTable = async (db: SQLite.SQLiteDatabase) => {
  await db.executeSql(`CREATE TABLE IF NOT EXISTS DownloadedTrack (
    video_id TEXT PRIMARY KEY,
    title TEXT,
    channelTitle TEXT,
    thumbnail TEXT,
    filePath TEXT,
    downloadedAt INTEGER
  );`);

  await db.executeSql(`CREATE TABLE IF NOT EXISTS Playlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    createdAt INTEGER
  );`);

  await db.executeSql(`CREATE TABLE IF NOT EXISTS PlaylistTrack (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playlist_id INTEGER NOT NULL,
    video_id TEXT NOT NULL,
    title TEXT,
    channelTitle TEXT,
    thumbnail TEXT,
    filePath TEXT,
    addedAt INTEGER,
    FOREIGN KEY (playlist_id) REFERENCES Playlist(id) ON DELETE CASCADE
  );`);
};

export const getDownloadedTracks = async (db: SQLite.SQLiteDatabase): Promise<IDownloadedTrack[]> => {
  try {
    const tracks: IDownloadedTrack[] = [];
    const results = await db.executeSql('SELECT * FROM DownloadedTrack ORDER BY downloadedAt DESC');
    results.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        tracks.push(result.rows.item(index));
      }
    });
    return tracks;
  } catch (error) {
    console.error(error);
    throw Error('Failed to get tracks from DB');
  }
};

export const getTrackById = async (db: SQLite.SQLiteDatabase, video_id: string): Promise<IDownloadedTrack | null> => {
  try {
    const results = await db.executeSql('SELECT * FROM DownloadedTrack WHERE video_id = ?', [video_id]);
    if (results[0].rows.length > 0) {
      return results[0].rows.item(0);
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const saveDownloadedTrack = async (db: SQLite.SQLiteDatabase, track: IDownloadedTrack) => {
  const insertQuery = `INSERT OR REPLACE INTO DownloadedTrack (video_id, title, channelTitle, thumbnail, filePath, downloadedAt) values (?, ?, ?, ?, ?, ?)`;
  return db.executeSql(insertQuery, [
    track.video_id,
    track.title,
    track.channelTitle,
    track.thumbnail,
    track.filePath,
    track.downloadedAt
  ]);
};

export const deleteTrackFromDb = async (db: SQLite.SQLiteDatabase, video_id: string) => {
  const deleteQuery = `DELETE FROM DownloadedTrack WHERE video_id = ?`;
  await db.executeSql(deleteQuery, [video_id]);
};

// ─── Playlist CRUD ───────────────────────────────────────────────────────────

export const getPlaylists = async (db: SQLite.SQLiteDatabase): Promise<IPlaylist[]> => {
  try {
    const playlists: IPlaylist[] = [];
    const results = await db.executeSql(
      `SELECT p.id, p.name, p.createdAt,
        (SELECT COUNT(*) FROM PlaylistTrack WHERE playlist_id = p.id) as trackCount
       FROM Playlist p ORDER BY p.createdAt DESC`,
    );
    results.forEach(result => {
      for (let i = 0; i < result.rows.length; i++) {
        playlists.push(result.rows.item(i));
      }
    });
    return playlists;
  } catch (error) {
    console.error('getPlaylists error:', error);
    return [];
  }
};

export const createPlaylist = async (db: SQLite.SQLiteDatabase, name: string): Promise<number> => {
  const result = await db.executeSql(
    `INSERT INTO Playlist (name, createdAt) VALUES (?, ?)`,
    [name, Date.now()],
  );
  return result[0].insertId;
};

export const deletePlaylist = async (db: SQLite.SQLiteDatabase, playlistId: number) => {
  await db.executeSql(`DELETE FROM Playlist WHERE id = ?`, [playlistId]);
};

export const renamePlaylist = async (db: SQLite.SQLiteDatabase, playlistId: number, name: string) => {
  await db.executeSql(`UPDATE Playlist SET name = ? WHERE id = ?`, [name, playlistId]);
};

export const getPlaylistTracks = async (
  db: SQLite.SQLiteDatabase,
  playlistId: number,
): Promise<IPlaylistTrack[]> => {
  try {
    const tracks: IPlaylistTrack[] = [];
    const results = await db.executeSql(
      `SELECT * FROM PlaylistTrack WHERE playlist_id = ? ORDER BY addedAt ASC`,
      [playlistId],
    );
    results.forEach(result => {
      for (let i = 0; i < result.rows.length; i++) {
        tracks.push(result.rows.item(i));
      }
    });
    return tracks;
  } catch (error) {
    console.error('getPlaylistTracks error:', error);
    return [];
  }
};

export const addTrackToPlaylist = async (
  db: SQLite.SQLiteDatabase,
  playlistId: number,
  track: { video_id: string; title: string; channelTitle: string; thumbnail: string; filePath: string },
) => {
  // avoid duplicate
  const existing = await db.executeSql(
    `SELECT id FROM PlaylistTrack WHERE playlist_id = ? AND video_id = ?`,
    [playlistId, track.video_id],
  );
  if (existing[0].rows.length > 0) return;
  await db.executeSql(
    `INSERT INTO PlaylistTrack (playlist_id, video_id, title, channelTitle, thumbnail, filePath, addedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [playlistId, track.video_id, track.title, track.channelTitle, track.thumbnail, track.filePath, Date.now()],
  );
};

export const removeTrackFromPlaylist = async (
  db: SQLite.SQLiteDatabase,
  playlistId: number,
  video_id: string,
) => {
  await db.executeSql(
    `DELETE FROM PlaylistTrack WHERE playlist_id = ? AND video_id = ?`,
    [playlistId, video_id],
  );
};
