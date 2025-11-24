// src/utils/coverUrlGuard.ts
import { type Book } from '../types/book';

/**
 * Returns a safe cover URL for a given book.
 * - If the book has a local `cover_image_path`, construct a localhost URL.
 * - If `cover_url` is present, ensure it is an absolute URL (starts with http/https).
 * - If the URL contains a placeholder domain like "example.com", replace with fallback.
 * - Otherwise, return a fallback image.
 */
export function getSafeCoverUrl(book: Book): string {
    // Local uploaded cover image path
    if (book.cover_image_path) {
        return `http://localhost:3000/${book.cover_image_path}`;
    }

    // Remote cover URL
    if (book.cover_url) {
        const urlStr = book.cover_url.trim();

        // Ensure it starts with http/https; otherwise prepend localhost
        // Also handle missing leading slash
        const url = urlStr.startsWith('http')
            ? urlStr
            : `http://localhost:3000${urlStr.startsWith('/') ? '' : '/'}${urlStr}`;

        // Guard against placeholder domains (example.com) or empty host
        try {
            const parsed = new URL(url);
            if (parsed.hostname === 'example.com' || parsed.hostname === 'abs.example.com') {
                return '/no_cover.png';
            }
            // Block double-prefixed URLs (e.g. localhost/https://...)
            if (parsed.pathname.includes('http:') || parsed.pathname.includes('https:')) {
                return '/no_cover.png';
            }
        } catch {
            // If URL parsing fails, fallback to placeholder image
            return '/no_cover.png';
        }
        return url;
    }

    // Fallback when no cover information is available
    return '/no_cover.png';
}
