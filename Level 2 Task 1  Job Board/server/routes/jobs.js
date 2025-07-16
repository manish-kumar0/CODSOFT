const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Job = require('../models/Job');
const Employer = require('../models/Employer');
const Application = require('../models/Application');

// @route    GET api/jobs
// @desc     Get all jobs
// @access   Public
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true })
      .populate('employer', ['companyName', 'website'])
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    GET api/jobs/featured
// @desc     Get featured jobs
// @access   Public
router.get('/featured', async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true })
      .populate('employer', ['companyName', 'website'])
      .sort({ createdAt: -1 })
      .limit(6);

    res.json(jobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    GET api/jobs/search
// @desc     Search jobs
// @access   Public
router.get('/search', async (req, res) => {
  try {
    const { title, location, type } = req.query;
    
    let query = { isActive: true };
    
    if (title) {
      query.title = { $regex: title, $options: 'i' };
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (type) {
      query.type = type;
    }
    
    const jobs = await Job.find(query)
      .populate('employer', ['companyName', 'website'])
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    GET api/jobs/:id
// @desc     Get job by ID
// @access   Public
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', ['companyName', 'website', 'description']);

    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    res.json(job);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Job not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route    POST api/jobs
// @desc     Create a job
// @access   Private (Employer)
router.post(
  '/',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('requirements', 'Requirements are required').isArray({ min: 1 }),
      check('skills', 'Skills are required').isArray({ min: 1 }),
      check('location', 'Location is required').not().isEmpty(),
      check('type', 'Type is required').not().isEmpty(),
      check('deadline', 'Deadline is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const employer = await Employer.findOne({ user: req.user.id });

      if (!employer) {
        return res.status(400).json({ msg: 'Employer profile not found' });
      }

      const newJob = new Job({
        ...req.body,
        employer: employer._id
      });

      const job = await newJob.save();

      res.json(job);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route    PUT api/jobs/:id
// @desc     Update a job
// @access   Private (Employer)
router.put('/:id', auth, async (req, res) => {
  try {
    const employer = await Employer.findOne({ user: req.user.id });
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Check if the job belongs to the employer
    if (job.employer.toString() !== employer._id.toString()) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(updatedJob);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Job not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route    DELETE api/jobs/:id
// @desc     Delete a job
// @access   Private (Employer)
router.delete('/:id', auth, async (req, res) => {
  try {
    const employer = await Employer.findOne({ user: req.user.id });
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Check if the job belongs to the employer
    if (job.employer.toString() !== employer._id.toString()) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await job.remove();

    res.json({ msg: 'Job removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Job not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route    GET api/jobs/employer/my-jobs
// @desc     Get all jobs posted by employer
// @access   Private (Employer)
router.get('/employer/my-jobs', auth, async (req, res) => {
  try {
    const employer = await Employer.findOne({ user: req.user.id });

    if (!employer) {
      return res.status(400).json({ msg: 'Employer profile not found' });
    }

    const jobs = await Job.find({ employer: employer._id }).sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    GET api/jobs/:id/applications
// @desc     Get applications for a job
// @access   Private (Employer)
router.get('/:id/applications', auth, async (req, res) => {
  try {
    const employer = await Employer.findOne({ user: req.user.id });
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ msg: 'Job not found' });
    }

    // Check if the job belongs to the employer
    if (job.employer.toString() !== employer._id.toString()) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const applications = await Application.find({ job: job._id })
      .populate('candidate', ['skills', 'experience', 'education'])
      .populate({
        path: 'candidate',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    res.json(applications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;