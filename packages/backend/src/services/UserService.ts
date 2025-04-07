import { Pool } from 'pg';
import { User } from '../types';
import { getPool } from '../config/database';

export class UserService {
  private pool: Promise<Pool>;

  constructor() {
    this.pool = getPool();
  }

  async findOrCreateUser(email: string): Promise<User> {
    const pool = await this.pool;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Try to find existing user
      const findUserQuery = `
        SELECT id, email, created_at
        FROM users
        WHERE email = $1
        LIMIT 1
      `;
      const existingUser = await client.query(findUserQuery, [email]);

      if (existingUser.rows[0]) {
        await client.query('COMMIT');
        return existingUser.rows[0];
      }

      // Create new user if not found
      const createUserQuery = `
        INSERT INTO users (email)
        VALUES ($1)
        RETURNING id, email, created_at
      `;
      const newUser = await client.query(createUserQuery, [email]);

      await client.query('COMMIT');
      return newUser.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw new Error(`Failed to find or create user: ${error}`);
    } finally {
      client.release();
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const pool = await this.pool;
      const findUserQuery = `
        SELECT id, email, created_at
        FROM users
        WHERE email = $1
        LIMIT 1
      `;
      const result = await pool.query(findUserQuery, [email]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find user: ${error}`);
    }
  }

  async findUserById(id: string): Promise<User | null> {
    try {
      const pool = await this.pool;
      const findUserQuery = `
        SELECT id, email, created_at
        FROM users
        WHERE id = $1
        LIMIT 1
      `;
      const result = await pool.query(findUserQuery, [id]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to find user: ${error}`);
    }
  }
} 