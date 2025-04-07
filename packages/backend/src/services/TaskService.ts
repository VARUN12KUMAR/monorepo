import { Pool } from 'pg';
import { Task, TaskStatus } from '../types';
import { getPool } from '../config/database';

export class TaskService {
  private pool: Promise<Pool>;

  constructor() {
    this.pool = getPool();
  }

  async createTask(title: string, description: string | null, userId: string): Promise<Task> {
    const createTaskQuery = `
      INSERT INTO tasks (title, description, created_by)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    try {
      const pool = await this.pool;
      const result = await pool.query(createTaskQuery, [title, description, userId]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Failed to create task: ${error}`);
    }
  }

  async findTask(taskId: string, userId: string): Promise<Task | null> {
    const query = `
      SELECT t.*, t.created_by as user_id
      FROM tasks t
      WHERE t.id = $1 AND t.created_by = $2
    `;
    
    try {
      const pool = await this.pool;
      const result = await pool.query(query, [taskId, userId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find task: ${error}`);
    }
  }

  async updateTask(taskId: string, userId: string, updates: Partial<Task>): Promise<Task> {
    const client = await this.pool;
    try {
      await client.query('BEGIN');

      // Check access rights
      const task = await this.findTask(taskId, userId);
      if (!task) {
        throw new Error('Task not found or unauthorized');
      }

      const updateTaskQuery = `
        UPDATE tasks 
        SET title = COALESCE($1, title),
            description = COALESCE($2, description),
            status = COALESCE($3, status),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING id, title, description, status, created_by as user_id, created_at, updated_at
      `;

      const result = await client.query(updateTaskQuery, [
        updates.title,
        updates.description,
        updates.status,
        taskId
      ]);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to update task: ${error}`);
    }
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    const client = await this.pool;
    try {
      await client.query('BEGIN');

      // Check if user owns the task
      const findTaskQuery = `
        SELECT id FROM tasks
        WHERE id = $1 AND created_by = $2
        LIMIT 1
      `;
      const task = await client.query(findTaskQuery, [taskId, userId]);
      
      if (!task.rows[0]) {
        throw new Error('Task not found or unauthorized');
      }

      // Delete task shares first due to foreign key constraint
      await client.query('DELETE FROM task_shares WHERE task_id = $1', [taskId]);
      
      // Delete the task
      await client.query('DELETE FROM tasks WHERE id = $1', [taskId]);
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to delete task: ${error}`);
    }
  }

  async shareTask(taskId: string, ownerId: string, sharedWithEmail: string): Promise<void> {
    const client = await this.pool;
    try {
      await client.query('BEGIN');

      // Check if task exists and user owns it
      const findTaskQuery = `
        SELECT id FROM tasks
        WHERE id = $1 AND created_by = $2
        LIMIT 1
      `;
      const task = await client.query(findTaskQuery, [taskId, ownerId]);
      
      if (!task.rows[0]) {
        throw new Error('Task not found or unauthorized');
      }

      // Find user to share with
      const findUserQuery = `
        SELECT id FROM users
        WHERE email = $1
        LIMIT 1
      `;
      const sharedUser = await client.query(findUserQuery, [sharedWithEmail]);
      
      if (!sharedUser.rows[0]) {
        throw new Error('User not found');
      }

      // Create task share
      const createShareQuery = `
        INSERT INTO task_shares (task_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT (task_id, user_id) DO NOTHING
      `;
      await client.query(createShareQuery, [taskId, sharedUser.rows[0].id]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to share task: ${error}`);
    }
  }

  async findAllTasks(userId: string, filter: 'all' | 'my' | 'shared' = 'all'): Promise<Task[]> {
    let query = '';
    const params = [userId];

    switch (filter) {
      case 'my':
        query = `
          SELECT t.*, t.created_by as user_id FROM tasks t
          WHERE t.created_by = $1
          ORDER BY t.created_at DESC
        `;
        break;
      case 'shared':
        query = `
          SELECT t.*, t.created_by as user_id FROM tasks t
          JOIN task_shares ts ON t.id = ts.task_id
          WHERE ts.user_id = $1
          ORDER BY t.created_at DESC
        `;
        break;
      default: // 'all'
        query = `
          SELECT DISTINCT t.*, t.created_by as user_id FROM tasks t
          LEFT JOIN task_shares ts ON t.id = ts.task_id
          WHERE t.created_by = $1 OR ts.user_id = $1
          ORDER BY t.created_at DESC
        `;
    }

    try {
      const pool = await this.pool;
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to find tasks: ${error}`);
    }
  }
} 