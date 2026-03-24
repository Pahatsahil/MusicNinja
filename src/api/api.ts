import RNFS from 'react-native-fs'

// utils/api.ts
const LOCAL_IP = 'http://192.168.29.27:6000'; // your Flask server IP

export const searchMusic = async (query: string) => {
    console.log(query, LOCAL_IP)
    const res = await fetch(`${LOCAL_IP}/search?q=${query}`);
    const data = await res.json();
    return data.results;
};

export const getAudio = async (videoId: string): Promise<string> => {
    const res = await fetch(`${LOCAL_IP}/generate-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: videoId }),
    });

    const blob = await res.blob();
    const base64 = await blob.arrayBuffer();
    const filePath = `${RNFS.DocumentDirectoryPath}/${videoId}.mp3`;
    await RNFS.writeFile(filePath, base64, 'base64');
    return filePath;
};
