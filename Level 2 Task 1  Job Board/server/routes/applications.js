const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const Employer = require('../models/Employer');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// @route    POST api/applications
// @desc     Apply for a job
// @access   Private (Candidate)
router.post(
  '/',
  [
    auth,
    [
      check('job', 'Job ID is required').not().isEmpty(),
      check('resume', 'Resume is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const candidate = await Candidate.findOne({ user: req.user.id });
      const job = await Job.findById(req.body.job);
      const employer = await Employer.findById(job.employer);
      const employerUser = await User.findById(employer.user);

      if (!candidate) {
        return res.status(400).json({ msg: 'Candidate profile not found' });
      }

      if (!job.isActive) {
        return res.status(400).json({ msg: 'This job is no longer active' });
      }

      // Check if already applied
      const existingApplication = await Application.findOne({
        job: job._id,
        candidate: candidate._id
      });

      if (existingApplication) {
        return res.status(400).json({ msg: 'Already applied to this job' });
      }

      const newApplication = new Application({
        job: job._id,
        candidate: candidate._id,
        employer: employer._id,
        resume: req.body.resume,
        coverLetter: req.body.coverLetter || ''
      });

      const application = await newApplication.save();

      // Send notification email to employer
      const employerMessage = `You have received a new application for the job "${job.title}" from ${req.user.name}.`;
      await sendEmail({
        email: employerUser.email,
        subject: 'New Job Application Received',
        message: employerMessage
      });

      // Send confirmation email to candidate
      const candidateMessage = `Thank you for applying to the job "${job.title}" at ${employer.companyName}.`;
      await sendEmail({
        email: req.user.email,
        subject: 'Job Application Submitted',
        message: candidateMessage
      });

      res.json(application);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route    GET api/applications/my-applications
// @desc     Get all applications by candidate
// @access   Private (Candidate)
router.get('/my-applications', auth, async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ user: req.user.id });

    if (!candidate) {
      return res.status(400).json({ msg: 'Candidate profile not found' });
    }

    const applications = await Application.find({ candidate: candidate._id })
      .populate('job', ['title', 'description', 'location', 'type'])
      .populate('employer', ['companyName'])
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    PUT api/applications/:id/status
// @desc     Update application status
// @access   Private (Employer)
router.put(
  '/:id/status',
  [
    auth,
    [
      check('status', 'Status is required').not().isEmpty().isIn(['pending', 'reviewed', 'rejected', 'accepted'])
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const employer = await Employer.findOne({ user: req.user.id });
      const application = await Application.findById(req.params.id)
        .populate('job', ['title'])
        .populate('candidate', ['user'])
        .populate({
          path: 'candidate',
          populate: {
            path: 'user',
            select: 'name email'
          }
        });

      if (!application) {
        return res.status(404).json({ msg: 'Application not found' });
      }

      // Check if the application belongs to the employer
      if (application.employer.toString() !== employer._id.toString()) {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      application.status = req.body.status;
      await application.save();

      // Send notification email to candidate
      const message = `Your application for the job "${application.job.title}" has been updated to ${req.body.status} status.`;
      await sendEmail({
        email: application.candidate.user.email,
        subject: 'Application Status Updated',
        message
      });

      res.json(application);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;