const jobManager = require('../services/jobManager');

const getJobs = (req, res) => {
    const jobs = jobManager.getAllJobs();
    res.json(jobs);
};

module.exports = {
    getJobs
};
