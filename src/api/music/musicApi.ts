import requestApi from "@api/requestApi";
import { Buffer } from "buffer";
import RNFS from 'react-native-fs'

export const searchMusic = async (query: string) => {
    try {
        console.log('http://192.168.29.27:6000/search?q=' + encodeURI(query))
        const data: any = await requestApi.getApi('search?q=' + encodeURI(query));
        if (data?.success)
            return data?.results;
    } catch (error: any) {
        console.error('Error in searchMusic:', error);
        if (error.response) {
            return error ?? { message: 'An error occurred' };
        } else {
            return { message: error || 'An unexpected error occurred' };
        }
    }
};

export const downloadMusic = async (video_id: string) => {
    try {
        console.log(video_id)
        const response = await fetch(`http://192.168.29.27:6000/generate-audio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ video_id }),
        });

        console.log(response, "RESUKLT")
        const arrayBuffer = await response.arrayBuffer();
        const base64Data = Buffer.from(arrayBuffer).toString('base64');

        const filePath = `${RNFS.DocumentDirectoryPath}/${video_id}.mp3`;
        await RNFS.writeFile(filePath, base64Data, 'base64');
        console.log('Saved file:', filePath);
        return filePath;
        // const blob = await res?.blob();
        // const base64 = await blob.arrayBuffer();
        // const filePath = `${RNFS.DocumentDirectoryPath}/${video_id}.mp3`;
        // await RNFS.writeFile(filePath, base64, 'base64');
        // return filePath;
    } catch (error: any) {
        console.error('Error in downloadMusic:', error?.message, video_id);
        if (error.response) {
            return error ?? { message: 'An error occurred' };
        } else {
            return { message: error || 'An unexpected error occurred' };
        }
    }
};