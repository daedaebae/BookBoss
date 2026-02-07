import { useQuery } from '@tanstack/react-query';
import { bookService } from '../../services/bookService';
import { type Book } from '../../types/book';

export const useBooks = (userId?: number) => {
    return useQuery({
        queryKey: ['books', userId],
        queryFn: async () => {
            const [booksData, userBooksData] = await Promise.all([
                bookService.getBooks(userId),
                bookService.getUserBooks().catch(() => [])
            ]);

            // Merge user progress
            return booksData.map((book: Book) => {
                const userBook = userBooksData.find((ub: any) => ub.book_id === book.id);
                if (userBook) {
                    return {
                        ...book,
                        user_status: userBook.status,
                        user_progress: userBook.progress,
                        user_rating: userBook.rating
                    };
                }
                return book;
            });
        }
    });
};
