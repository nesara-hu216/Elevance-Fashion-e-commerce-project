const express = require('express');
const router = express.Router();
const {
  registerDeviceToken,
  getPreferences,
  updatePreferences,
  getNotificationLogs,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/register-device', registerDeviceToken);
router.get('/preferences', getPreferences);
router.patch('/preferences', updatePreferences);
router.get('/logs', getNotificationLogs);

module.exports = router;
