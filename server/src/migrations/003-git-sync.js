module.exports = {
    up: async (connection) => {
        // Add GitHub sync columns if they don't exist
        const [numColumns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'feature_requests' 
              AND COLUMN_NAME = 'github_issue_number'
        `);
        if (numColumns.length === 0) {
            await connection.query(`ALTER TABLE feature_requests ADD COLUMN \`github_issue_number\` INT DEFAULT NULL`);
        }

        const [urlColumns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'feature_requests' 
              AND COLUMN_NAME = 'github_issue_url'
        `);
        if (urlColumns.length === 0) {
            await connection.query(`ALTER TABLE feature_requests ADD COLUMN \`github_issue_url\` VARCHAR(500) DEFAULT NULL`);
        }
    }
};
