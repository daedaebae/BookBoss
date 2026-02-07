const db = require('../config/db');
const axios = require('axios');

const saveSearch = (req, res) => {
    const userId = req.user.id;
    const { name, query_params } = req.body;

    if (!name || !query_params) {
        return res.status(400).json({ error: 'Name and query parameters are required' });
    }

    db.query(
        'INSERT INTO saved_searches (user_id, name, query_params) VALUES (?, ?, ?)',
        [userId, name, JSON.stringify(query_params)],
        (err, result) => {
            if (err) { console.error('Error saving search:', err); return res.status(500).json({ error: err.message }); }
            res.status(201).json({
                id: result.insertId,
                message: 'Search saved successfully'
            });
        }
    );
};

const getSavedSearches = (req, res) => {
    const userId = req.user.id;

    db.query(
        'SELECT * FROM saved_searches WHERE user_id = ? ORDER BY created_at DESC',
        [userId],
        (err, results) => {
            if (err) { console.error('Error fetching saved searches:', err); return res.status(500).json({ error: err.message }); }

            const searches = results.map(search => ({
                ...search,
                query_params: JSON.parse(search.query_params)
            }));

            res.json(searches);
        }
    );
};

const deleteSavedSearch = (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    db.query(
        'DELETE FROM saved_searches WHERE id = ? AND user_id = ?',
        [id, userId],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ error: 'Saved search not found' });
            res.json({ message: 'Saved search deleted' });
        }
    );
};


const searchOnline = async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'Query required' });

    let results = { kind: 'books#volumes', totalItems: 0, items: [] };

    // 1. Try Google Books
    try {
        console.log(`[Search] Proxying Google Books search for: ${q}`);
        const response = await axios.get(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=20`);
        if (response.data.items) {
            return res.json(response.data);
        }
    } catch (error) {
        console.warn('[Search] Google Books failed (likely rate limit 429):', error.message);
    }

    // 2. Fallback to OpenLibrary
    try {
        console.log(`[Search] Fallback to OpenLibrary for: ${q}`);
        const olResponse = await axios.get(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=20`);

        if (olResponse.data && olResponse.data.docs) {
            results.items = olResponse.data.docs.map(doc => ({
                id: doc.key,
                volumeInfo: {
                    title: doc.title,
                    authors: doc.author_name || [],
                    description: doc.first_sentence ? doc.first_sentence[0] : (doc.subject ? `Subjects: ${doc.subject.slice(0, 5).join(', ')}` : ''),
                    publishedDate: doc.first_publish_year ? doc.first_publish_year.toString() : null,
                    pageCount: doc.number_of_pages_median || null,
                    publisher: doc.publisher ? doc.publisher[0] : null,
                    categories: doc.subject ? doc.subject.slice(0, 3) : [],
                    imageLinks: doc.cover_i ? {
                        thumbnail: `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`,
                        smallThumbnail: `https://covers.openlibrary.org/b/id/${doc.cover_i}-S.jpg`
                    } : null,
                    industryIdentifiers: doc.isbn ? doc.isbn.map(isbn => ({ type: 'ISBN', identifier: isbn })) : []
                }
            }));
            results.totalItems = olResponse.data.numFound;
        }

        res.json(results);

    } catch (error) {
        console.error('[Search] All providers failed:', error.message);
        res.status(503).json({ error: 'Search services unavailable. Please try again later.' });
    }
};

const getEditions = async (req, res) => {
    const { workId } = req.query;
    if (!workId) return res.status(400).json({ error: 'Work ID required' });

    try {
        console.log(`[Editions] Fetching editions for: ${workId}`);
        const response = await axios.get(`https://openlibrary.org${workId}/editions.json?limit=50`);
        res.json(response.data);
    } catch (error) {
        console.error('[Editions] Fetch failed:', error.message);
        res.status(500).json({ error: 'Failed to fetch editions' });
    }
};

module.exports = {
    saveSearch,
    getSavedSearches,
    deleteSavedSearch,
    searchOnline,
    getEditions
};
