const jobManager = {
    jobs: new Map(),
    nextId: 1,

    createJob(type, description) {
        const id = this.nextId++;
        const job = {
            id,
            type,
            description,
            status: 'running', // running, completed, failed
            progress: 0,
            total: 0,
            processed: 0,
            result: null,
            startTime: new Date(),
            updates: [] // Log of simple string updates
        };
        this.jobs.set(id, job);
        return job;
    },

    getJob(id) {
        return this.jobs.get(id);
    },

    getAllJobs() {
        return Array.from(this.jobs.values()).sort((a, b) => b.startTime - a.startTime);
    },

    updateJob(id, updates) {
        const job = this.jobs.get(id);
        if (!job) return;
        Object.assign(job, updates);
        if (updates.message) {
            job.updates.push({ time: new Date(), message: updates.message });
            // Keep log size sane
            if (job.updates.length > 50) job.updates.shift();
        }
    },

    completeJob(id, result = null) {
        const job = this.jobs.get(id);
        if (!job) return;
        job.status = 'completed';
        job.progress = 100;
        job.result = result;
        job.endTime = new Date();
    },

    failJob(id, error) {
        const job = this.jobs.get(id);
        if (!job) return;
        job.status = 'failed';
        job.error = error;
        job.endTime = new Date();
    },

    // Cleanup old jobs
    cleanup() {
        const now = new Date();
        for (const [id, job] of this.jobs.entries()) {
            if (job.status !== 'running' && job.endTime) {
                const diffMs = now - job.endTime;
                // Remove jobs older than 1 hour
                if (diffMs > 1000 * 60 * 60) {
                    this.jobs.delete(id);
                }
            }
        }
    }
};

// Periodic cleanup
setInterval(() => jobManager.cleanup(), 1000 * 60 * 15);

module.exports = jobManager;
