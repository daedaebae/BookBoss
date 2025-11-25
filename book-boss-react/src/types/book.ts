export interface Book {
    id: number;
    title: string;
    author: string;
    isbn?: string;
    library?: string;
    cover_url?: string;
    cover_image_path?: string;
    epub_file_path?: string;
    shelf?: string; // Legacy shelf string
    shelf_ids?: number[]; // New Many-to-Many shelf IDs
    status?: 'Not Started' | 'In Progress' | 'Completed' | 'DNF';
    format?: string;

    // New Metadata Fields
    // New Metadata Fields
    series?: string;
    series_order?: number;
    series_index?: number;
    publisher?: string;
    language?: string;
    description?: string;
    rating?: number;
    page_count?: number;
    publication_date?: string;

    categories?: string | string[];
    binding_type?: string;
    descriptors?: string | string[];
    added_at: string;

    // Loan Status
    is_loaned?: boolean;
    borrower_name?: string;
    loan_date?: string;
    due_date?: string;

    // Reading Progress (Local)
    current_page?: number;
    progress_percentage?: number;
    last_read_at?: string;

    // User Specific Data (joined from user_books)
    user_status?: 'read' | 'reading' | 'plan_to_read' | 'dropped';
    user_progress?: number;
    user_rating?: number;
}

export interface BookFilters {
    search?: string;
    library?: string;
    sortBy?: 'added_desc' | 'added_asc' | 'title_asc' | 'author_asc' | 'rating_desc' | 'page_count_desc' | 'pub_date_desc';
    series?: string;
    publisher?: string;
    language?: string;
}
