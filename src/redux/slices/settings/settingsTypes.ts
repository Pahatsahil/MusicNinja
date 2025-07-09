import { iTHEMES } from "@utills/ThemeContext";

export interface InitialSettings {
    preferences: {
        art: Array<string>,
        music: Array<string>,
        poetry: Array<string>,
    },
    // language:                                  Language Types
    theme: keyof iTHEMES,
    report: {
        type: string,
        description: string,
        image?: {
            name: string
            path: string
            type: string
        }
    }
}