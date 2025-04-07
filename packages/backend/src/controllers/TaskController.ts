import { Request, Response } from 'express';
import { TaskService } from '../services/TaskService';
import { Task } from '../types';

export class TaskController {
  private taskService: TaskService;

  constructor() {
    this.taskService = new TaskService();
  }

  createTask = async (req: Request, res: Response) => {
    try {
      const { title, description } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const task = await this.taskService.createTask(title, description, userId);
      res.status(201).json(task);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  };

  getTasks = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const filter = (req.query.filter as 'all' | 'my' | 'shared') || 'all';
      const tasks = await this.taskService.findAllTasks(userId, filter);
      res.json(tasks);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  };

  updateTask = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const updates = req.body as Partial<Task>;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!id) {
        return res.status(400).json({ error: 'Task ID is required' });
      }

      const task = await this.taskService.updateTask(id, userId, updates);
      res.json(task);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  };

  deleteTask = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!id) {
        return res.status(400).json({ error: 'Task ID is required' });
      }

      await this.taskService.deleteTask(id, userId);
      res.status(204).send();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  };

  shareTask = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const { email } = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!id) {
        return res.status(400).json({ error: 'Task ID is required' });
      }

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      await this.taskService.shareTask(id, userId, email);
      res.status(200).json({ message: 'Task shared successfully' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      res.status(500).json({ error: errorMessage });
    }
  };
} 