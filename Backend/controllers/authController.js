const User = require("../models/user");
const generateToken = require("../utils/generateToken");

// @desc Register user
exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ name, email, password, role });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ValidationError') {
      // Handle mongoose validation errors
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors 
      });
    } else if (error.code === 11000) {
      // Handle duplicate key error (e.g., duplicate email)
      return res.status(400).json({ 
        message: 'Email already exists',
        field: 'email'
      });
    }
    // For other types of errors
    res.status(500).json({ 
      message: 'Registration failed',
      error: error.message 
    });
  }
};

// @desc Login user
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) return res.status(400).json({ message: "Invalid credentials" });

  const isMatch = await user.matchPassword(password);
  if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id, user.role),
  });
};

// @desc Get logged-in user profile
exports.getMe = async (req, res) => {
  res.json(req.user);
};
