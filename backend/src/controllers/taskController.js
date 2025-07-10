const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');

exports.createTask = asyncHandler(async (req, res) => {
  const { title, description, dueDate, priority, parentTaskId } = req.body;
  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  if (parentTaskId) {
    const parentTask = await Task.findById(parentTaskId);
    if (!parentTask) {
      return res.status(400).json({ message: 'Parent task not found' });
    }
    if (parentTask.parentTaskId) {
      return res.status(400).json({ message: 'Subtasks cannot have subtasks' });
    }
  }

  const task = await Task.create({
    userId: req.user._id,
    title,
    description,
    dueDate,
    priority,
    parentTaskId,
  });

  res.status(201).json(task);
});

exports.getTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ userId: req.user._id })
    .populate('dependencies', 'title status')
    .lean();
  res.json(tasks);
});

exports.getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('dependencies', 'title status')
    .lean();
  if (!task || task.userId.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: 'Task not found' });
  }
  res.json(task);
});

exports.updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task || task.userId.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: 'Task not found' });
  }

  if (req.body.status === 'Completed' && task.parentTaskId) {
    const parentTask = await Task.findById(task.parentTaskId);
    if (parentTask && parentTask.status !== 'Completed') {
      return res.status(400).json({ message: 'Parent task must be completed first' });
    }
  }

  if (req.body.status === 'Completed') {
    const subtasks = await Task.find({ parentTaskId: task._id });
    if (subtasks.some(subtask => subtask.status !== 'Completed')) {
      return res.status(400).json({ message: 'All subtasks must be completed first' });
    }

    const dependentTasks = await Task.find({ dependencies: task._id });
    for (const dependentTask of dependentTasks) {
      if (dependentTask.status === 'Blocked') {
        const dependencies = await Task.find({ _id: { $in: dependentTask.dependencies } });
        if (dependencies.every(dep => dep.status === 'Completed')) {
          dependentTask.status = 'To Do';
          await dependentTask.save();
        }
      }
    }
  }

  Object.assign(task, req.body);
  await task.save();
  res.json(task);
});

exports.deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task || task.userId.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: 'Task not found' });
  }

  await Task.deleteMany({ parentTaskId: task._id });
  await Task.updateMany(
    { dependencies: task._id },
    { $pull: { dependencies: task._id } }
  );

  await task.remove();
  res.json({ message: 'Task deleted' });
});

exports.createSubtask = asyncHandler(async (req, res) => {
  const { title, description, dueDate, priority } = req.body;
  const parentId = req.params.id;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  const parentTask = await Task.findById(parentId);
  if (!parentTask || parentTask.userId.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: 'Parent task not found' });
  }
  if (parentTask.parentTaskId) {
    return res.status(400).json({ message: 'Subtasks cannot have subtasks' });
  }

  const subtask = await Task.create({
    userId: req.user._id,
    title,
    description,
    dueDate,
    priority,
    parentTaskId: parentId,
  });

  res.status(201).json(subtask);
});

exports.addDependency = asyncHandler(async (req, res) => {
  const { dependsOnTaskId } = req.body;
  const taskId = req.params.id;

  const task = await Task.findById(taskId);
  if (!task || task.userId.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const dependency = await Task.findById(dependsOnTaskId);
  if (!dependency || dependency.userId.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: 'Dependency task not found' });
  }

  if (task._id.toString() === dependsOnTaskId) {
    return res.status(400).json({ message: 'Task cannot depend on itself' });
  }

  if (task.dependencies.includes(dependsOnTaskId)) {
    return res.status(400).json({ message: 'Dependency already exists' });
  }

  const hasCycle = await exports.hasCircularDependency(taskId, dependsOnTaskId);
  if (hasCycle) {
    return res.status(400).json({ message: 'Circular dependency detected' });
  }

  task.dependencies.push(dependsOnTaskId);
  if (dependency.status !== 'Completed') {
    task.status = 'Blocked';
  }
  await task.save();

  res.json(task);
});

exports.removeDependency = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task || task.userId.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: 'Task not found' });
  }

  task.dependencies = task.dependencies.filter(dep => dep.toString() !== req.params.depId);
  if (task.dependencies.length === 0 && task.status === 'Blocked') {
    task.status = 'To Do';
  }
  await task.save();

  res.json(task);
});

exports.getDependencies = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id).populate('dependencies', 'title status');
  if (!task || task.userId.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: 'Task not found' });
  }
  res.json(task.dependencies);
});

exports.getDependents = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ dependencies: req.params.id, userId: req.user._id })
    .populate('dependencies', 'title status')
    .lean();
  res.json(tasks);
});

exports.getTaskTree = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ userId: req.user._id })
    .populate('dependencies', 'title status')
    .lean();

  const buildTree = (tasks, parentId = null) => {
    return tasks
      .filter(task => (task.parentTaskId ? task.parentTaskId.toString() : null) === parentId)
      .map(task => ({
        ...task,
        subtasks: buildTree(tasks, task._id.toString()),
      }));
  };

  res.json(buildTree(tasks));
});

exports.hasCircularDependency = async (taskId, dependsOnTaskId) => {
  if (!taskId || !dependsOnTaskId) return false;

  const visited = new Set();
  const recStack = new Set();

  const dfs = async (currentTaskId) => {  
    visited.add(currentTaskId.toString());
    recStack.add(currentTaskId.toString());

    const task = await Task.findById(currentTaskId).lean();
    if (!task) return false;

    for (const depId of task.dependencies) {
      if (!visited.has(depId.toString())) {
        if (await dfs(depId)) return true;
      } else if (recStack.has(depId.toString())) {
        return true;
      }
    }

    recStack.delete(currentTaskId.toString());
    return false;
  };

  return await dfs(dependsOnTaskId);
};