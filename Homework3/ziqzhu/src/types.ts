// Global types and interfaces are stored here.
export interface Margin {
    readonly left: number;
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
}

export interface SpotifyRow {
    track_id: string;
    track_name: string;
    track_number: number;
    track_popularity: number;
    explicit: boolean;
    artist_name: string;
    artist_popularity: number;
    artist_followers: number;
    artist_genres: string;
    album_id: string;
    album_name: string;
    album_release_date: string;
    album_total_tracks: number;
    album_type: string;
    track_duration_min: number;
    release_year: number;
}

export interface AlbumTypeCount {
    type: string;
    count: number;
}