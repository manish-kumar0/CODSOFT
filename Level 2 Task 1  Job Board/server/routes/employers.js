const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Employer = require('../models/Employer');
const User = require('../models/User');

// @route    GET api/employers/me
// @desc     Get current employer profile
// @access   Private (Employer)
router.get('/me', auth, async (req, res) => {
  try {
    const employer = await Employer.findOne({ user: req.user.id }).populate('user', ['name', 'email']);

    if (!employer) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    res.json(employer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    PUT api/employers/me
// @desc     Update employer profile
// @access   Private (Employer)
router.put(
  '/me',
  [
    auth,
    [
      check('companyName', 'Company name is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      companyName,
      website,
      description,
      address,
      phone
    } = req.body;

    try {
      let employer = await Employer.findOne({ user: req.user.id });

      if (!employer) {
        return res.status(400).json({ msg: 'Employer profile not found' });
      }

      employer = await Employer.findOneAndUpdate(
        { user: req.user.id },
        { $set: {
          companyName,
          website,
          description,
          address,
          phone
        }},
        { new: true }
      ).populate('user', ['name', 'email']);

      res.json(employer);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

module.exports = router;