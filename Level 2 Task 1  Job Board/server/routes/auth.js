const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Employer = require('../models/Employer');
const Candidate = require('../models/Candidate');
const sendEmail = require('../utils/sendEmail');

// @route    POST api/auth/register
// @desc     Register user
// @access   Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('role', 'Please select a valid role').isIn(['candidate', 'employer'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role } = req.body;

    try {
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      user = new User({
        name,
        email,
        password,
        role
      });

      await user.save();

      // Create profile based on role
      if (role === 'employer') {
        const employer = new Employer({ user: user._id });
        await employer.save();
      } else if (role === 'candidate') {
        const candidate = new Candidate({ user: user._id });
        await candidate.save();
      }

      // Create token
      const token = user.getSignedJwtToken();

      // Send welcome email
      const message = `Welcome to JobBoard, ${name}! You have successfully registered as a ${role}.`;
      await sendEmail({
        email: user.email,
        subject: 'Welcome to JobBoard',
        message
      });

      res.json({ token });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route    POST api/auth/login
// @desc     Login user
// @access   Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email }).select('+password');

      if (!user) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      const isMatch = await user.matchPassword(password);

      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid credentials' });
      }

      const token = user.getSignedJwtToken();

      res.json({ token });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route    GET api/auth/me
// @desc     Get current user
// @access   Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    let profile;
    if (user.role === 'employer') {
      profile = await Employer.findOne({ user: req.user.id }).populate('user', ['name', 'email']);
    } else if (user.role === 'candidate') {
      profile = await Candidate.findOne({ user: req.user.id }).populate('user', ['name', 'email']);
    }

    res.json({ user, profile });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;