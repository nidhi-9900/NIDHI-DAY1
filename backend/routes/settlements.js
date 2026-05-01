const router = require('express').Router();
const { getGroupSettlements } = require('../controllers/settlementController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/', getGroupSettlements);

module.exports = router;
