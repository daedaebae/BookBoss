export interface PrivacySettings {
    share_shelves: boolean;
    share_progress: boolean;
}

export interface UserProfile {
    id: number;
    username: string;
    privacy_settings?: PrivacySettings;
}
