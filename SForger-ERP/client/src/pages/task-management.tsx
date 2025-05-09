import { useState } from "react";
import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Edit2, Trash } from "lucide-react";

interface Task {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export default function TaskManagement() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleAddTask = () => {
    const newId = tasks.length > 0 ? tasks[tasks.length - 1].id + 1 : 1;
    const newTaskData: Task = {
      id: newId,
      title: newTask,
      description: newDescription,
      completed: false,
    };
    setTasks([...tasks, newTaskData]);
    setNewTask("");
    setNewDescription("");
  };

  const handleToggleComplete = (taskId: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = (taskId: number) => {
    setTasks(tasks.filter((task) => task.id !== taskId));
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setNewTask(task.title);
    setNewDescription(task.description);
  };

  const handleUpdateTask = () => {
    if (editingTask) {
      setTasks(
        tasks.map((task) =>
          task.id === editingTask.id
            ? { ...task, title: newTask, description: newDescription }
            : task
        )
      );
      setEditingTask(null);
      setNewTask("");
      setNewDescription("");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Task Management</CardTitle>
            <CardDescription>Create, update, and manage your tasks</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="task-title">Task Title</Label>
                  <Input
                    id="task-title"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="Enter task title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-description">Task Description</Label>
                  <Input
                    id="task-description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Enter task description"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button onClick={handleAddTask} disabled={!newTask || !newDescription}>
                  Add Task
                </Button>

                {editingTask && (
                  <Button onClick={handleUpdateTask} variant="outline">
                    Update Task
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-8">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className={task.completed ? "line-through" : ""}>
                        {task.title}
                      </TableCell>
                      <TableCell>{task.description}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleComplete(task.id)}
                        >
                          {task.completed ? <CheckCircle className="h-4 w-4" /> : "Mark as Done"}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTask(task)}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            <Trash className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
