import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks, createTask, updateTask, deleteTask, createSubtask, addDependency } from '../features/tasks/taskSlice';
import api from '../services/api';

const Tasks = () => {
  const dispatch = useDispatch();
  const { tasks, loading, error } = useSelector(state => state.tasks);
  const [form, setForm] = useState({ title: '', description: '', dueDate: '', priority: 'Medium', parentTaskId: '', dependsOnTaskId: '' });
  const [showSubtaskForm, setShowSubtaskForm] = useState(null);
  const [showDependencyForm, setShowDependencyForm] = useState(null);

  useEffect(() => {
    dispatch(fetchTasks());
  }, [dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await dispatch(createTask(form));
    setForm({ title: '', description: '', dueDate: '', priority: 'Medium', parentTaskId: '', dependsOnTaskId: '' });
  };

  const handleUpdate = async (id, updates) => {
    await dispatch(updateTask({ id, updates }));
  };

  const handleDelete = async (id) => {
    await dispatch(deleteTask(id));
  };

  const handleSubtask = async (parentId) => {
    const subtask = { title: form.title, description: form.description, dueDate: form.dueDate, priority: form.priority, parentTaskId: parentId };
    await dispatch(createSubtask({ parentId, subtask }));
    setForm({ title: '', description: '', dueDate: '', priority: 'Medium', parentTaskId: '', dependsOnTaskId: '' });
    setShowSubtaskForm(null);
  };

  const handleAddDependency = async (taskId) => {
    const { dependsOnTaskId } = form;
    const response = await api.post('/tasks/validate-dependencies', { taskId, dependsOnTaskId });
    if (response.data.hasCycle) {
      alert('Cannot add dependency: Circular dependency detected');
      return;
    }
    await dispatch(addDependency({ taskId, dependsOnTaskId }));
    setForm({ ...form, dependsOnTaskId: '' });
    setShowDependencyForm(null);
  };

  const renderTasks = (tasks, parentId = null, level = 0) => {
    return tasks
      .filter(task => (task.parentTaskId ? task.parentTaskId.toString() : null) === parentId)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate) || ['Low', 'Medium', 'High'].indexOf(a.priority) - ['Low', 'Medium', 'High'].indexOf(b.priority))
      .map(task => (
        <div key={task._id} className={`ml-${level * 4} p-2 border-b`}>
          <div className="flex justify-between">
            <div>
              <h3 className="font-bold">{task.title}</h3>
              <p>{task.description}</p>
              <p>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</p>
              <p>Priority: {task.priority}</p>
              <p>Status: {task.status}</p>
              {task.dependencies.length > 0 && (
                <p>Depends on: {task.dependencies.map(dep => dep.title).join(', ')}</p>
              )}
            </div>
            <div>
              <select
                value={task.status}
                onChange={e => handleUpdate(task._id, { status: e.target.value })}
                className="border p-1"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Blocked">Blocked</option>
              </select>
              <button
                onClick={() => handleDelete(task._id)}
                className="bg-red-500 text-white p-1 ml-2 rounded"
              >
                Delete
              </button>
              <button
                onClick={() => setShowSubtaskForm(task._id)}
                className="bg-green-500 text-white p-1 ml-2 rounded"
              >
                Add Subtask
              </button>
              <button
                onClick={() => setShowDependencyForm(task._id)}
                className="bg-blue-500 text-white p-1 ml-2 rounded"
              >
                Add Dependency
              </button>
            </div>
          </div>
          {showSubtaskForm === task._id && (
            <form onSubmit={e => { e.preventDefault(); handleSubtask(task._id); }} className="mt-2 space-y-2">
              <input
                type="text"
                placeholder="Subtask Title"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
                className="border p-2 w-full"
              />
              <input
                type="text"
                placeholder="Description"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="border p-2 w-full"
              />
              <input
                type="date"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
                className="border p-2 w-full"
              />
              <select
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
                className="border p-2 w-full"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
              <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">
                Create Subtask
              </button>
            </form>
          )}
          {showDependencyForm === task._id && (
            <form onSubmit={e => { e.preventDefault(); handleAddDependency(task._id); }} className="mt-2 space-y-2">
              <select
                value={form.dependsOnTaskId}
                onChange={e => setForm({ ...form, dependsOnTaskId: e.target.value })}
                className="border p-2 w-full"
              >
                <option value="">Select Dependency</option>
                {tasks.map(t => (
                  <option key={t._id} value={t._id}>{t.title}</option>
                ))}
              </select>
              <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">
                Add Dependency
              </button>
            </form>
          )}
          {renderTasks(tasks, task._id, level + 1)}
        </div>
      ));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Tasks</h1>
      {error && <p className="text-red-500">{error}</p>}
      {loading && <p>Loading...</p>}
      <form onSubmit={handleSubmit} className="mb-4 space-y-4">
        <input
          type="text"
          placeholder="Task Title"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          required
          className="border p-2 w-full"
        />
        <input
          type="text"
          placeholder="Description"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="border p-2 w-full"
        />
        <input
          type="date"
          value={form.dueDate}
          onChange={e => setForm({ ...form, dueDate: e.target.value })}
          className="border p-2 w-full"
        />
        <select
          value={form.priority}
          onChange={e => setForm({ ...form, priority: e.target.value })}
          className="border p-2 w-full"
        >
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded w-full">
          Create Task
        </button>
      </form>
      <div>{renderTasks(tasks)}</div>
    </div>
  );
};

export default Tasks;