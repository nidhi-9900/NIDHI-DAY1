const router = require('express').Router();
const { signup, login, getMe, getUsers, updateProfile } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/signup',  signup);
router.post('/login',   login);
router.get('/me',       auth, getMe);
router.put('/me',       auth, updateProfile);
router.get('/users',    auth, getUsers);

module.exports = router;
