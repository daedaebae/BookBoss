import jobManager from '../services/jobManager';

const getJobs = (req, res) => {
    const jobs = jobManager.getAllJobs();
    res.json(jobs);
};

export default {
    getJobs
};
