const User = require('../models/User');
const jwt  = require('jsonwebtoken');

const makeToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Name, email and password are required.' });
    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists)
      return res.status(400).json({ message: 'This email is already registered.' });

    const user = await new User({ name, email, password }).save();
    console.log('New user registered:', user.email);

    const token = makeToken(user._id);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const email    = req.body.email;
    const password = req.body.password;

    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password)))
      return res.status(400).json({ message: 'Invalid email or password.' });

    console.log('Login:', user.email);
    const token = makeToken(user._id);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (name && name.trim()) user.name = name.trim();

    if (newPassword) {
      if (!currentPassword)
        return res.status(400).json({ message: 'Current password is required to set a new one.' });
      const match = await user.comparePassword(currentPassword);
      if (!match)
        return res.status(400).json({ message: 'Current password is incorrect.' });
      if (newPassword.length < 6)
        return res.status(400).json({ message: 'New password must be at least 6 characters.' });
      user.password = newPassword;
    }

    await user.save();
    res.json({ id: user._id, name: user.name, email: user.email });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUsers = async function(req, res) {
  try {
    const { search } = req.query;
    const query = search
      ? { email: { $regex: search, $options: 'i' }, _id: { $ne: req.userId } }
      : { _id: { $ne: req.userId } };
    const users = await User.find(query).select('name email').limit(20);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
