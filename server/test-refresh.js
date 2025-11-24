/**
 * Test script for metadata refresh endpoint
 * Run this after restarting the server to verify the endpoint works
 */

const axios = require('axios');

async function testRefreshMetadata() {
    try {
        console.log('Testing metadata refresh endpoint...');
        console.log('Note: This requires authentication. Make sure you have books with cover URLs in the database.\n');

        // First, try to access the endpoint without auth (should fail with 403)
        try {
            const response = await axios.post('http://localhost:3000/api/books/refresh-metadata');
            console.log('❌ ERROR: Endpoint should require authentication!');
        } catch (error) {
            if (error.response && error.response.status === 403) {
                console.log('✅ Authentication required (as expected)');
            } else if (error.response && error.response.status === 404) {
                console.log('❌ ERROR: Endpoint not found! Server needs to be restarted.');
                console.log('   Run: Ctrl+C to stop server, then: node server.js');
                return;
            } else {
                console.log('⚠️  Unexpected error:', error.message);
            }
        }

        console.log('\nTo test with authentication:');
        console.log('1. Log in to the web app');
        console.log('2. Open browser console (F12)');
        console.log('3. Run: localStorage.getItem("token")');
        console.log('4. Copy the token');
        console.log('5. Run this command:');
        console.log('   curl -X POST http://localhost:3000/api/books/refresh-metadata \\');
        console.log('        -H "Authorization: Bearer YOUR_TOKEN_HERE" \\');
        console.log('        -H "Content-Type: application/json"');

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testRefreshMetadata();
