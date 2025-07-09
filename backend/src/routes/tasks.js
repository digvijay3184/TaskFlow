const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  createSubtask,
  addDependency,
  removeDependency,
  getDependencies,
  getDependents,
  getTaskTree,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/subtasks', createSubtask);
router.get('/:id/subtasks', getDependencies); // Adjusted to fetch subtasks
router.post('/:id/dependencies', addDependency);
router.delete('/:id/dependencies/:depId', removeDependency);
router.get('/:id/dependencies', getDependencies);
router.get('/:id/dependents', getDependents);
router.get('/tree', getTaskTree);
router.post('/validate-dependencies', async (req, res) => {
  const { taskId, dependsOnTaskId } = req.body;
  const hasCycle = await require('../controllers/taskController').hasCircularDependency(taskId, dependsOnTaskId);
  res.json({ hasCycle });
});

module.exports = router;