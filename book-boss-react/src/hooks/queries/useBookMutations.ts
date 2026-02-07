import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bookService } from '../../services/bookService';

export const useBookMutations = () => {
    const queryClient = useQueryClient();

    const addBook = useMutation({
        mutationFn: (formData: FormData) => bookService.addBook(formData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
        }
    });

    const updateBook = useMutation({
        mutationFn: ({ id, data }: { id: number; data: FormData | any }) => bookService.updateBook(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
            // Invalidate specific book detail if needed? 
            // queryClient.invalidateQueries({ queryKey: ['book', id] }); 
        }
    });

    const deleteBook = useMutation({
        mutationFn: (id: number) => bookService.deleteBook(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
        }
    });

    const bulkDeleteBooks = useMutation({
        mutationFn: (ids: number[]) => bookService.bulkDeleteBooks(ids),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
        }
    });

    const bulkUpdateShelf = useMutation({
        mutationFn: async ({ ids, shelf }: { ids: number[], shelf: string }) => {
            // Parallel updates or bulk endpoint if available. 
            // Service `updateBook` maps to single update usually.
            // We can use `Promise.all` here wrapper.
            // Ideally implement `bulkUpdateBooks` in service/backend.
            // Backend `bulkUpdateBooks` endpoint exists now!
            // Let's use it if service supports it, or loop.
            // Checking `bookService`: it has `bulkDeleteBooks`. Does it have `bulkUpdateBooks`?
            // Need to check `bookService.ts`. 
            // Assuming for now we loop as per `Library.tsx` original logic, 
            // OR verify `bookService`. I'll assume loop or add `bulkUpdate` to service later.
            // For this hook, I will replicate `Library.tsx` logic: Promise.all loop.
            await Promise.all(ids.map(id => {
                const formData = new FormData();
                formData.append('shelf', shelf);
                return bookService.updateBook(id, formData);
            }));
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
        }
    });

    const addToShelf = useMutation({
        mutationFn: async ({ bookId, shelfId }: { bookId: number, shelfId: number }) => {
            // We need to import shelfService or move logic to bookService? 
            // shelfService has addBookToShelf.
            // We can import shelfService here.
            // But wait, `shelfService` is not imported yet.
            // I'll stick to `bookService` if possible or just import `shelfService`.
            // Actually, simplest is to use shelfService here.
            const { shelfService } = await import('../../services/shelfService');
            return shelfService.addBookToShelf(shelfId, bookId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['books'] });
        }
    });

    return {
        addBook,
        updateBook,
        deleteBook,
        bulkDeleteBooks,
        bulkUpdateShelf,
        addToShelf
    };
};
