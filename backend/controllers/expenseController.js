const Expense = require('../models/Expense');
const Group   = require('../models/Group');

exports.getExpenses = async (req, res) => {
  try {
    const { groupId } = req.query;
    const query = groupId
      ? { group: groupId }
      : { $or: [{ paidBy: req.userId }, { 'splits.user': req.userId }] };

    const expenses = await Expense.find(query)
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email')
      .populate('group', 'name')
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addExpense = async (req, res) => {
  try {
    const { description, amount, category, groupId, splitType, customSplits } = req.body;

    if (!description || !amount || !groupId)
      return res.status(400).json({ message: 'Description, amount and group are required.' });
    if (parseFloat(amount) <= 0)
      return res.status(400).json({ message: 'Amount must be greater than zero.' });

    const group = await Group.findById(groupId).populate('members', 'name email');
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (!group.members.some(m => m._id.toString() === req.userId))
      return res.status(403).json({ message: "You're not a member of this group." });

    const amt = parseFloat(amount);
    let splits = [];

    if (splitType === 'equal') {
      const perPerson = parseFloat((amt / group.members.length).toFixed(2));
      let runningTotal = 0;
      splits = group.members.map((member, idx) => {
        const memberAmt = idx === group.members.length - 1
          ? parseFloat((amt - runningTotal).toFixed(2))
          : perPerson;
        runningTotal += memberAmt;
        return { user: member._id, amount: memberAmt };
      });
    } else if (splitType === 'custom' && customSplits) {
      const total = customSplits.reduce((s, c) => s + parseFloat(c.amount), 0);
      if (Math.abs(total - amt) > 0.02)
        return res.status(400).json({ message: `Split total ${total} doesn't match expense amount ${amt}.` });
      splits = customSplits.map(s => ({ user: s.userId, amount: parseFloat(s.amount) }));
    } else {
      return res.status(400).json({ message: 'Invalid split type.' });
    }

    const expense = await new Expense({
      description, amount: amt,
      category: category || 'other',
      group: groupId, paidBy: req.userId,
      splits, splitType: splitType || 'equal'
    }).save();

    group.totalExpense = parseFloat((group.totalExpense + amt).toFixed(2));
    await group.save();

    await expense.populate('paidBy', 'name email');
    await expense.populate('splits.user', 'name email');
    await expense.populate('group', 'name');

    console.log('Expense added:', description, '| amount:', amt);
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found.' });
    if (expense.paidBy.toString() !== req.userId)
      return res.status(403).json({ message: 'Only the payer can edit this expense.' });

    const { description, amount, category } = req.body;

    if (amount !== undefined) {
      const newAmt = parseFloat(amount);
      if (newAmt <= 0)
        return res.status(400).json({ message: 'Amount must be greater than zero.' });

      const diff = newAmt - expense.amount;
      await Group.findByIdAndUpdate(expense.group, { $inc: { totalExpense: diff } });

      // recalculate equal splits with new amount
      if (expense.splitType === 'equal') {
        const group = await Group.findById(expense.group).populate('members', '_id');
        const perPerson = parseFloat((newAmt / group.members.length).toFixed(2));
        let running = 0;
        expense.splits = group.members.map((m, i) => {
          const amt = i === group.members.length - 1
            ? parseFloat((newAmt - running).toFixed(2))
            : perPerson;
          running += amt;
          return { user: m._id, amount: amt };
        });
      }

      expense.amount = newAmt;
    }

    if (description) expense.description = description;
    if (category)    expense.category    = category;

    await expense.save();
    await expense.populate('paidBy', 'name email');
    await expense.populate('splits.user', 'name email');
    await expense.populate('group', 'name');

    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found.' });
    if (expense.paidBy.toString() !== req.userId)
      return res.status(403).json({ message: 'Only the payer can delete this expense.' });

    await Group.findByIdAndUpdate(expense.group, { $inc: { totalExpense: -expense.amount } });
    await expense.deleteOne();
    res.json({ message: 'Expense deleted.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
