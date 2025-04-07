import { 
  Auth,
  signInWithCustomToken, 
  signInWithEmailAndPassword,
  onAuthStateChanged
} from '@firebase/auth';
import api from './axios';
import { auth } from '../config/firebase';

export class AuthService {
  private auth: Auth;
  private authInitialized: boolean = false;
  private authInitPromise: Promise<void>;

  constructor() {
    this.auth = auth;
    console.log('AuthService initialized');
    this.authInitPromise = new Promise((resolve) => {
      this.setupAuthListener(resolve);
    });
    this.initializeToken();
  }

  private async initializeToken() {
    console.log('Initializing token...');
    const currentUser = this.auth.currentUser;
    console.log('Current user:', currentUser);
    if (currentUser) {
      const token = await currentUser.getIdToken();
      console.log('Initial token:', token);
      this.setToken(token);
    }
  }

  private setToken(token: string) {
    console.log('Setting token:', token);
    if (!token) {
      console.warn('Attempting to set null/empty token');
      return;
    }
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('Token set in localStorage and axios headers');
    console.log('Current axios headers:', api.defaults.headers.common);
  }

  private setupAuthListener(initResolve: () => void) {
    console.log('Setting up auth listener');
    onAuthStateChanged(this.auth, async (user) => {
      console.log('Auth state changed. User:', user);
      if (user) {
        const token = await user.getIdToken();
        console.log('New token from auth state change:', token);
        this.setToken(token);
      } else {
        console.log('User signed out, clearing token');
        this.clearToken();
      }
      
      if (!this.authInitialized) {
        this.authInitialized = true;
        initResolve();
      }
    });
  }

  async waitForAuthInit() {
    await this.authInitPromise;
  }

  private clearToken() {
    console.log('Clearing token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    console.log('Token cleared from localStorage and axios headers');
  }

  async login(email: string, password: string) {
    try {
      console.log('Starting login process for email:', email);
      
      // First sign in with Firebase
      console.log('Attempting Firebase sign in...');
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      console.log('Firebase sign in successful:', userCredential);

      const idToken = await userCredential.user.getIdToken();
      console.log('Got Firebase ID token:', idToken);
      
      // Set token before making backend request
      this.setToken(idToken);

      // Then authenticate with our backend
      console.log('Making backend login request...');
      const response = await api.post('/api/auth/login', { 
        email, 
        password 
      }, {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });
      
      console.log('Backend login response:', response.data);
      const { user } = response.data;

      localStorage.setItem('user', JSON.stringify(user));
      console.log('User data stored');

      return { user, token: idToken };
    } catch (error) {
      console.error('Login error:', error);
      this.clearToken(); // Clear token on error
      throw error;
    }
  }

  async register(email: string, password: string) {
    try {
      const response = await api.post('/api/auth/register', { email, password });
      const { token: customToken, user } = response.data;

      const userCredential = await signInWithCustomToken(this.auth, customToken);
      const idToken = await userCredential.user.getIdToken();
      this.setToken(idToken);

      localStorage.setItem('user', JSON.stringify(user));

      return { user, token: idToken };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async refreshToken(): Promise<string | null> {
    try {
      const currentUser = this.auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken(true);
        this.setToken(token);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  logout() {
    this.clearToken();
    this.auth.signOut();
    window.location.href = '/login';
  }

  isAuthenticated() {
    return !!this.auth.currentUser;
  }

  getToken() {
    return localStorage.getItem('token');
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}

export default new AuthService(); 