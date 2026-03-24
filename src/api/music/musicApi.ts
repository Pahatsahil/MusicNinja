import requestApi from "@api/requestApi";
import { Buffer } from "buffer";
import RNFS from 'react-native-fs'

export const getLatestMusic = async () => {
    try {
        console.log('/get_dashboard')
        const data: any = await requestApi.getApi('get_dashboard');
        if (data?.success)
            return data?.results;
    } catch (error: any) {
        console.error('Error in getLatestMusic:', error);
        if (error.response) {
            return error ?? { message: 'An error occurred' };
        } else {
            return { message: error || 'An unexpected error occurred' };
        }
    }
};

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

export const downloadMusic = async (video_id: string): Promise<string> => {
    console.log('Downloading from server:', video_id);

    const response = await requestApi.postApi(
        `generate-audio`,
        { video_id },
        { responseType: 'arraybuffer' },
    );

    const base64Data = Buffer.from(response.data as ArrayBuffer).toString('base64');
    const filePath = `${RNFS.DocumentDirectoryPath}/${video_id}.mp3`;
    await RNFS.writeFile(filePath, base64Data, 'base64');
    console.log('Saved file:', filePath);
    return filePath;
};