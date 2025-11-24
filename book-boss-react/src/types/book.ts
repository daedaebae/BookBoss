export interface Book {
    id: number;
    title: string;
    author: string;
    isbn?: string;
    library?: string;
    cover_url?: string;
    cover_image_path?: string;
    shelf?: string;
    status?: 'Not Started' | 'In Progress' | 'Completed' | 'DNF';
    format?: string;
    series?: string;
    rating?: number;
    page_count?: number;
    publication_date?: string;
    descriptors?: string;
    added_at: string;
    is_loaned?: boolean;
    borrower_name?: string;
    loan_date?: string;
    due_date?: string;
}

export interface BookFilters {
    search?: string;
    library?: string;
    sortBy?: 'added_desc' | 'added_asc' | 'title_asc' | 'author_asc' | 'rating_desc' | 'page_count_desc' | 'pub_date_desc';
}
