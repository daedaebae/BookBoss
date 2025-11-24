export interface Book {
    id: number;
    title: string;
    author: string;
    isbn?: string;
    library?: string;
    cover_url?: string;
    added_at: string;
    binding_type?: string;
    descriptors?: string;
}

export interface BookFilters {
    search?: string;
    library?: string;
    sortBy?: 'added_desc' | 'added_asc' | 'title_asc' | 'author_asc';
}
