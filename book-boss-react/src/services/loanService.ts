import apiClient from './api';
import { type Loan } from '../types/loan';

export const loanService = {
    getLoans: async (): Promise<Loan[]> => {
        const response = await apiClient.get<Loan[]>('/loans');
        return response.data;
    },

    createLoan: async (bookId: number, borrowerName: string, dueDate?: string, notes?: string): Promise<void> => {
        await apiClient.post('/loans', {
            book_id: bookId,
            borrower_name: borrowerName,
            due_date: dueDate,
            notes
        });
    },

    returnLoan: async (loanId: number): Promise<void> => {
        await apiClient.put(`/loans/${loanId}/return`);
    }
};
