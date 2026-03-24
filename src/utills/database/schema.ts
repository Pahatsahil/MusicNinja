import SQLite from 'react-native-sqlite-storage';

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
  const query = `CREATE TABLE IF NOT EXISTS DownloadedTrack (
    video_id TEXT PRIMARY KEY,
    title TEXT,
    channelTitle TEXT,
    thumbnail TEXT,
    filePath TEXT,
    downloadedAt INTEGER
  );`;
  await db.executeSql(query);
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
