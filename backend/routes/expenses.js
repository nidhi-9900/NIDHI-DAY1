const router = require('express').Router();
const { getExpenses, addExpense, updateExpense, deleteExpense } = require('../controllers/expenseController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/',       getExpenses);
router.post('/',      addExpense);
router.put('/:id',    updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
