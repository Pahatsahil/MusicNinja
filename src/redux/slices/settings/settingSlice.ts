import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InitialSettings } from './settingsTypes';


const initialState: InitialSettings = {
    preferences: {
        art: [],
        music: [],
        poetry: []
    },
    theme: 'LIGHT',
    report: {
        description: '',
        type: '',
        image: {
            name: '',
            type: '',
            path: '',
        }
    }
};

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setParticularSettings: <K extends keyof InitialSettings>(
            state: InitialSettings,
            action: PayloadAction<{ key: K; value: InitialSettings[K] }>
        ) => {
            const { key, value } = action.payload;
            state[key] = value;
        },
    },
});

export const { setParticularSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
