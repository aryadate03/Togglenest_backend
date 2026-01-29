const Task = require('../models/Task');
const Project = require('../models/Project');

// @desc    Get all tasks (with project population)
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  console.log('🔵 ========== GET TASKS CALLED ==========');
  
  try {
    const { project, status, priority, assignedTo } = req.query;
    
    let filter = {};
    if (project) filter.project = project;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    console.log('🔍 Filter:', filter);

    const tasks = await Task.find(filter)
      .populate('project', 'title description')  // ✅ Use 'project' not 'projectId'
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    console.log(`✅ Tasks found: ${tasks.length}`);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('❌ ERROR:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('projectId', 'title description')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      project: req.body.project || req.body.projectId,
      createdBy: req.user._id,
      stage: 'planning'
    };

    delete taskData.projectId;

    console.log('📝 Creating task:', taskData);

    const task = await Task.create(taskData);
    
    // ✅ FIX: Don't populate immediately after create
    // Just return the created task
    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('❌ Error creating task:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('projectId', 'title description')
      .populate('assignedTo', 'name email avatar');

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update task status (for Kanban board drag-drop)
// @route   PATCH /api/tasks/:id/status
// @access  Private
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // ✅ Support both formats
    const validStatuses = ['backlog', 'todo', 'inprogress', 'done'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    task.status = status;
    
    // ✅ Auto-update completedAt
    if (status === 'done') {
      task.completedAt = new Date();
    } else {
      task.completedAt = null;
    }

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('projectId', 'title description')
      .populate('assignedTo', 'name email avatar');

    console.log(`✅ Task status updated: ${task.title} → ${status}`);

    res.status(200).json({
      success: true,
      data: populatedTask,
      message: `Task status updated to ${status}`
    });
  } catch (error) {
    console.error('❌ Error in updateTaskStatus:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting task:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};