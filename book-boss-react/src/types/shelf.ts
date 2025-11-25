export interface Shelf {
    id: number;
    user_id: number;
    name: string;
    created_at?: string;
}

export interface ShelfBook {
    shelf_id: number;
    book_id: number;
    added_at: string;
}
