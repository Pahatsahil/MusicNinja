import requestApi from "@api/requestApi";
import { Buffer } from "buffer";
import RNFS from 'react-native-fs'

export const searchMusic = async (query: string) => {
    try {
        console.log('/search?q=' + query)
        const data: any = await requestApi.getApi('search?q=' + query);
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
        console.log('Downloading:', video_id);

        const response = await requestApi.postApi(
            `generate-audio`,
            { video_id },
            { responseType: 'arraybuffer' },   // ← tell Axios to keep the raw binary
        );

        // response.data is now an ArrayBuffer
        const base64Data = Buffer.from(response.data as ArrayBuffer).toString('base64');

        const filePath = `${RNFS.DocumentDirectoryPath}/${video_id}.mp3`;
        await RNFS.writeFile(filePath, base64Data, 'base64');
        console.log('Saved file:', filePath);
        return filePath;
    } catch (error: any) {
        console.error('Error in downloadMusic:', error?.message, video_id);
        if (error.response) {
            return error ?? { message: 'An error occurred' };
        } else {
            return { message: error || 'An unexpected error occurred' };
        }
    }
};