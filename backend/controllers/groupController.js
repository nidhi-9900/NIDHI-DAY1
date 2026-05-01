const Group = require('../models/Group');
const User  = require('../models/User');

exports.getGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.userId })
      .populate('members', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createGroup = async (req, res) => {
  try {
    // not destructuring here on purpose - easier to debug
    const name         = req.body.name;
    const description  = req.body.description;
    const memberEmails = req.body.memberEmails;

    if (!name) return res.status(400).json({ message: 'Group name is required.' });

    let memberIds = [req.userId];

    if (memberEmails && memberEmails.length > 0) {
      const validEmails = memberEmails.filter(e => e.trim());
      if (validEmails.length) {
        const found = await User.find({ email: { $in: validEmails.map(e => e.toLowerCase()) } });
        found.forEach(u => {
          if (!memberIds.some(id => id.toString() === u._id.toString()))
            memberIds.push(u._id);
        });
      }
    }

    const group = await new Group({
      name,
      description: description || '',
      members: memberIds,
      createdBy: req.userId
    }).save();

    await group.populate('members', 'name email');
    await group.populate('createdBy', 'name email');

    // TODO: notify members via email when they're added
    console.log('Group created:', group.name, 'members:', group.members.length);
    res.status(201).json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'name email')
      .populate('createdBy', 'name email');

    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (!group.members.some(m => m._id.toString() === req.userId))
      return res.status(403).json({ message: 'You are not a member of this group.' });

    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) return res.status(404).json({ message: 'No user found with that email.' });

    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    if (group.members.some(m => m.toString() === userToAdd._id.toString()))
      return res.status(400).json({ message: 'This user is already in the group.' });

    group.members.push(userToAdd._id);
    await group.save();
    await group.populate('members', 'name email');
    await group.populate('createdBy', 'name email');
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (group.createdBy.toString() !== req.userId)
      return res.status(403).json({ message: 'Only the group creator can delete this group.' });
    await group.deleteOne();
    res.json({ message: 'Group deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
