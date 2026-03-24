import { NativeEventEmitter, NativeModules } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { PLATFORM_IOS } from '@utills/Common';
import { useAppDispatch } from '@redux/store/hooks';
import { showToast } from '@redux/slices/toast/toastSlice';
import { useFocusEffect } from '@react-navigation/native';

const { MusicPlayer } = NativeModules;
const MusicPlayerEvents = new NativeEventEmitter(MusicPlayer);

const useMusicPlayer = () => {
    const dispatch = useAppDispatch();
    const [isPlaying, setIsPlaying] = useState(false);
    const [soundLoader, setSoundLoader] = useState(false);
    const [playerStatus, setPlayerStatus] = useState({
        elapsedTime: 0,
        duration: 0,
    });

    const [completed, setCompleted] = useState(null);

    useFocusEffect(useCallback(() => {
        setSoundLoader(false)
        setIsPlaying(false)
    }, []))

    useEffect(() => {
        // Subscribe to playback status updates
        const statusSubscription = MusicPlayerEvents.addListener(
            'onPlaybackStatus',
            status => {
                if (PLATFORM_IOS && status?.status === 'started') {
                    setSoundLoader(false);
                }
                setPlayerStatus({
                    elapsedTime: status.currentTime,
                    duration: status.duration,
                });
                setIsPlaying(status.isPlaying);
            },
        );

        // Subscribe to playback completion event
        const completionSubscription = MusicPlayerEvents.addListener(
            'onPlaybackComplete',
            data => {
                setIsPlaying(false);

                if (!data.completed && data.error) {
                    setSoundLoader(false);
                    dispatch(
                        showToast({
                            message: 'Unable to load the music file.',
                            type: 'error',
                        }),
                    );
                    // console.error('Playback error:', data.error);
                }
                setCompleted(data.completed);
            },
        );

        // Clean up subscriptions on unmount
        return () => {
            statusSubscription.remove();
            completionSubscription.remove();

            // Stop playback if something is still playing
            MusicPlayer?.stopPlayback()
                .then(() => {
                    setIsPlaying(false);
                    setSoundLoader(false);
                })
                .catch((err: any) =>
                    console.error('Error stopping playback on unmount:', err),
                );
        };
    }, []);

    const playSoundIos = async (uri: string) => {
        try {
            setSoundLoader(true);
            MusicPlayer?.convertWavToM4a(uri).then(async (newUri: string) => {
                const sound = await MusicPlayer?.playAudio(newUri);
                console.log('enter in play', uri, sound, newUri);
            });
        } catch (error) {
            console.log('ERROR PLAY', error);
        }
        !PLATFORM_IOS && setSoundLoader(false);
    };
    const playSoundAndroid = async (uri: string) => {
        console.log('this si s', uri);
        try {
            setSoundLoader(true);
            // MusicPlayer?.convertWavToM4a(uri).then(async (newUri: string) => {

            const sound = await MusicPlayer?.playAudio(uri);
            console.log('enter in play', uri, sound);
        } catch (error) {
            console.log('ERROR PLAY', error);
        }
        !PLATFORM_IOS && setSoundLoader(false);
    };

    const pauseSound = async () => {
        if (isPlaying) {
            await MusicPlayer?.pauseAudio();
        }
    };

    const resumeSound = async () => {
        if (isPlaying) {
            await MusicPlayer?.resumeAudio();
        }
    };

    const stopSound = async () => {
        if (isPlaying) {
            setIsPlaying(false);
            setSoundLoader(false);
            await MusicPlayer?.stopPlayback();
        }
    };

    return {
        playSound: PLATFORM_IOS ? playSoundIos : playSoundAndroid,
        playSound2: playSoundAndroid,
        resumeSound,
        pauseSound,
        stopSound,
        isPlaying,
        playerStatus,
        completed,
        soundLoader,
    };
};
export default useMusicPlayer;
