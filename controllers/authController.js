const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { getDBMode } = require('../config/db');
const { mockUsers } = require('../models/mockStore');
const generateToken = require('../utils/generateToken');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please add all fields' });
    }

    if (getDBMode()) {
      // Mock DB Mode
      const userExists = mockUsers.find(u => u.email === email.toLowerCase());
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists in mock store' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = {
        _id: 'user_' + (mockUsers.length + 1),
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        createdAt: new Date(),
        setupCompleted: false
      };

      mockUsers.push(newUser);

      res.status(201).json({
        success: true,
        token: generateToken(newUser._id),
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          setupCompleted: false
        }
      });
    } else {
      // Real DB Mode
      const userExists = await User.findOne({ email });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User already exists' });
      }

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password
      });

      res.status(201).json({
        success: true,
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          setupCompleted: false
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please add email and password' });
    }

    if (getDBMode()) {
      // Mock DB Mode
      const user = mockUsers.find(u => u.email === email.toLowerCase());
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      res.json({
        success: true,
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          setupCompleted: user.setupCompleted || false
        }
      });
    } else {
      // Real DB Mode
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }

      res.json({
        success: true,
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          setupCompleted: user.setupCompleted || false
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user.id || req.user._id,
        name: req.user.name,
        email: req.user.email,
        setupCompleted: req.user.setupCompleted || false
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Complete new user organization setup
// @route   POST /api/auth/setup
// @access  Private
const completeSetup = async (req, res) => {
  try {
    const { organizationName } = req.body;
    
    if (getDBMode()) {
      const userIndex = mockUsers.findIndex(u => u._id === (req.user.id || req.user._id));
      if (userIndex !== -1) {
        mockUsers[userIndex].setupCompleted = true;
        if (organizationName) {
          mockUsers[userIndex].name = organizationName;
        }
        req.user.setupCompleted = true;
        req.user.name = mockUsers[userIndex].name;
      }
    } else {
      const user = await User.findById(req.user.id || req.user._id);
      if (user) {
        user.setupCompleted = true;
        if (organizationName) {
          user.name = organizationName;
        }
        await user.save();
        req.user.setupCompleted = true;
        req.user.name = user.name;
      }
    }

    res.json({
      success: true,
      user: {
        id: req.user.id || req.user._id,
        name: req.user.name,
        email: req.user.email,
        setupCompleted: true
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  completeSetup
};
