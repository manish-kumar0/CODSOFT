const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Candidate = require('../models/Candidate');
const User = require('../models/User');

// @route    GET api/candidates/me
// @desc     Get current candidate profile
// @access   Private (Candidate)
router.get('/me', auth, async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ user: req.user.id }).populate('user', ['name', 'email']);

    if (!candidate) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    res.json(candidate);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    PUT api/candidates/me
// @desc     Update candidate profile
// @access   Private (Candidate)
router.put(
  '/me',
  [
    auth,
    [
      check('skills', 'Skills are required').isArray({ min: 1 })
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      skills,
      experience,
      education,
      resume,
      location,
      phone
    } = req.body;

    try {
      let candidate = await Candidate.findOne({ user: req.user.id });

      if (!candidate) {
        return res.status(400).json({ msg: 'Candidate profile not found' });
      }

      candidate = await Candidate.findOneAndUpdate(
        { user: req.user.id },
        { $set: {
          skills,
          experience,
          education,
          resume,
          location,
          phone
        }},
        { new: true }
      ).populate('user', ['name', 'email']);

      res.json(candidate);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;