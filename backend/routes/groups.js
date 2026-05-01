const router = require('express').Router();
const { getGroups, createGroup, getGroup, addMember, deleteGroup } = require('../controllers/groupController');
const auth = require('../middleware/auth');

router.use(auth);
router.get('/',              getGroups);
router.post('/',             createGroup);
router.get('/:id',           getGroup);
router.post('/:id/members',  addMember);
router.delete('/:id',        deleteGroup);

module.exports = router;
