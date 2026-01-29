const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

const taskController = require('../controllers/taskController');

console.log('📋 Available exports:', Object.keys(taskController));

// ✅ CLEANUP ROUTE BEFORE PROTECT MIDDLEWARE (no auth needed)
router.get('/cleanup', async (req, res) => {
  try {
    const Task = require('../models/Task');
    
    const allTasks = await Task.find({});
    console.log(`📊 Total tasks: ${allTasks.length}`);
    
    const corruptTasks = await Task.find({
      $or: [
        { project: null },
        { project: { $exists: false } }
      ]
    });
    
    console.log(`🗑️ Corrupt tasks: ${corruptTasks.length}`);
    
    const result = await Task.deleteMany({
      $or: [
        { project: null },
        { project: { $exists: false } }
      ]
    });
    
    res.json({
      success: true,
      totalTasks: allTasks.length,
      corruptTasks: corruptTasks.length,
      deletedCount: result.deletedCount,
      message: `Deleted ${result.deletedCount} corrupt tasks`
    });
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ✅ PROTECT ALL ROUTES BELOW THIS LINE
router.use(protect);

router.get('/', taskController.getTasks);
router.post('/', taskController.createTask);
// router.get('/:id', taskController.getTask);  // Commented out - function missing
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);
router.patch('/:id/status', taskController.updateTaskStatus);

module.exports = router;