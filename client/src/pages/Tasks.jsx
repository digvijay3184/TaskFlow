import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
} from "../features/tasks/taskSlice";

function Tasks() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const { tasks, error } = useSelector((state) => state.tasks);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getTasks());
  }, [dispatch]);

  const onSubmit = (e) => {
    e.preventDefault();
    dispatch(createTask({ title, description }));
    setTitle("");
    setDescription("");
  };

  const handleUpdate = async (task) => {
    const updatedData = {
      title: task.title,
      description: task.description,
      status: task.status === "Completed" ? "To Do" : "Completed",
    };
    console.log("Dispatching updateTask with:", {
      id: task._id,
      data: updatedData,
    });
    const result = await dispatch(
      updateTask({ id: task._id, data: updatedData })
    );
    console.log("Update result:", result);
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setShowDeletePopup(true);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      dispatch(deleteTask(taskToDelete._id));
      setShowDeletePopup(false);
      setTaskToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeletePopup(false);
    setTaskToDelete(null);
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
            <p>
              Status:{" "}
              <span
                style={{
                  color: task.status === "Completed" ? "#00ffaa" : "#ffcc00",
                  fontWeight: "bold",
                }}
              >
                {task.status}
              </span>
            </p>
            <button
              className={
                task.status === "Completed" ? "incomplete-btn" : "complete-btn"
              }
              onClick={() => handleUpdate(task)}
            >
              {task.status === "Completed"
                ? "↩ Mark Incomplete"
                : "✓ Mark Complete"}
            </button>
            <button
              className="delete-btn"
              onClick={() => handleDeleteClick(task)}
            >
              🗑 Delete
            </button>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Popup */}
      {showDeletePopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to delete the task "
              <strong>{taskToDelete?.title}</strong>"?
            </p>
            <p style={{ color: "#ff6b6b", fontSize: "0.9rem" }}>
              This action cannot be undone.
            </p>
            <div className="popup-buttons">
              <button className="cancel-btn" onClick={cancelDelete}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;
