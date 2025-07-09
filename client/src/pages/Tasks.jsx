import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createTask, getTasks, updateTask, deleteTask } from '../features/tasks/taskSlice';

function Tasks() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const { tasks, error } = useSelector((state) => state.tasks);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getTasks());
  }, [dispatch]);

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(createTask({ title, description }));
    setTitle('');
    setDescription('');
  };

  const handleUpdate = async (task) => {
    const updatedData = {
      title: task.title,
      description: task.description,
      status: task.status === 'Completed' ? 'To Do' : 'Completed',
    };
    console.log('Dispatching updateTask with:', { id: task._id, data: updatedData });
    const result = await dispatch(updateTask({ id: task._id, data: updatedData }));
    console.log('Update result:', result);
  };

  const handleDelete = (id) => {
    dispatch(deleteTask(id));
  };

  return (
    <div className="container">
      <h2>Tasks</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <button type="submit">Add Task</button>
      </form>
      <div className="task-list">
        {tasks.map((task) => (
          <div key={task._id} className="task-card">
            <h3>{task.title}</h3>
            <p>{task.description}</p>
            <p>Status: {task.status}</p>
            <button onClick={() => handleUpdate(task)}>
              {task.status === 'Completed' ? 'Mark Incomplete' : 'Mark Complete'}
            </button>
            <button onClick={() => handleDelete(task._id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Tasks;
