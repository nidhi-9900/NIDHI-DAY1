const Expense = require('../models/Expense');
const Group   = require('../models/Group');

// min-cash-flow algorithm: settle balances with fewest transactions
// sort both lists descending, then greedily match largest debtor to largest creditor
function calcSettlements(balances) {
  const creditors = [];
  const debtors   = [];

  Object.entries(balances).forEach(([id, d]) => {
    const net = parseFloat(d.net.toFixed(2));
    if (net > 0.01)       creditors.push({ id, name: d.name, amount: net });
    else if (net < -0.01) debtors.push({ id, name: d.name, amount: Math.abs(net) });
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const result = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const transfer = Math.min(debtors[i].amount, creditors[j].amount);
    if (transfer > 0.01) {
      result.push({
        from:   { id: debtors[i].id,   name: debtors[i].name },
        to:     { id: creditors[j].id, name: creditors[j].name },
        amount: parseFloat(transfer.toFixed(2))
      });
    }
    debtors[i].amount   = parseFloat((debtors[i].amount   - transfer).toFixed(2));
    creditors[j].amount = parseFloat((creditors[j].amount - transfer).toFixed(2));
    if (debtors[i].amount   < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return result;
}

exports.getGroupSettlements = async (req, res) => {
  try {
    const { groupId } = req.query;
    if (!groupId) return res.status(400).json({ message: 'groupId is required.' });

    const group = await Group.findById(groupId).populate('members', 'name email');
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    const expenses = await Expense.find({ group: groupId })
      .populate('paidBy', 'name email')
      .populate('splits.user', 'name email');

    const balances = {};
    group.members.forEach(m => {
      balances[m._id.toString()] = { name: m.name, email: m.email, totalPaid: 0, totalOwed: 0, net: 0 };
    });

    expenses.forEach(expense => {
      const payerId = expense.paidBy._id.toString();
      if (balances[payerId]) balances[payerId].totalPaid += expense.amount;

      expense.splits.forEach(split => {
        const uid = split.user._id.toString();
        if (balances[uid]) balances[uid].totalOwed += split.amount;
      });
    });

    Object.keys(balances).forEach(id => {
      balances[id].net = balances[id].totalPaid - balances[id].totalOwed;
    });

    const settlements  = calcSettlements(balances);
    const balanceArray = Object.entries(balances).map(([id, d]) => ({
      id,
      name:      d.name,
      email:     d.email,
      totalPaid: parseFloat(d.totalPaid.toFixed(2)),
      totalOwed: parseFloat(d.totalOwed.toFixed(2)),
      net:       parseFloat(d.net.toFixed(2))
    }));

    console.log('Settlements for group', groupId, ':', settlements.length, 'transactions needed');

    res.json({
      groupId,
      groupName:    group.name,
      totalExpense: parseFloat(group.totalExpense.toFixed(2)),
      balances:     balanceArray,
      settlements
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
