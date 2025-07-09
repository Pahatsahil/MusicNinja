
export type iCategory = "poem" | "art" | "music"


export interface iGalleryPayload {
    offset: number,
    limit: number,
    category: iCategory;
    id?: string;
    type: 'both' | 'public';
}

export interface iGalleryData {
    _id: string
    output_file: string
    like_count?: string
    thumbnail: string
    is_post_public:boolean
}

export interface iGalleryDetails {
    offset: number,
    limit: number,
    total: number,
    hasMore: boolean,
    data: Array<iGalleryData>

}
export interface iFollowPayload {
  offset: number,
    limit: number,
    type: "follower"|"following"
    filter?:string,
}