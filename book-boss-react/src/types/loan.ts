export interface Loan {
    id: number;
    user_id: number;
    book_id: number;
    book_title?: string;
    borrower_name: string;
    loan_date: string;
    due_date?: string;
    return_date?: string;
    notes?: string;
}
