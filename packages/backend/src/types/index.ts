export interface User {
  id: string;
  email: string;
  created_at: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface TaskShare {
  id: string;
  task_id: string;
  user_id: string;
  created_at: Date;
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

// Add this to express Request type
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
} 