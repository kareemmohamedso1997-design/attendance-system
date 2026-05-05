/**
 * Login Page JavaScript
 * Handles authentication and token management
 */

class LoginManager {
  constructor() {
    this.apiBaseUrl = '/api';
    this.form = document.getElementById('loginForm');
    this.usernameInput = document.getElementById('username');
    this.passwordInput = document.getElementById('password');
    this.messageAlert = document.getElementById('messageAlert');
    this.loginBtn = this.form.querySelector('button[type="submit"]');
    
    this.init();
  }

  init() {
    this.form.addEventListener('submit', (e) => this.handleLogin(e));
    
    // Load saved username if remember me was checked
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      this.usernameInput.value = savedUsername;
      document.getElementById('remember').checked = true;
    }

    // Check if already logged in
    const token = localStorage.getItem('accessToken');
    if (token) {
      this.redirectToDashboard();
    }
  }

  async handleLogin(e) {
    e.preventDefault();

    const username = this.usernameInput.value.trim();
    const password = this.passwordInput.value;
    const remember = document.getElementById('remember').checked;

    // Validation
    if (!username || !password) {
      this.showMessage('Please enter username and password', 'error');
      return;
    }

    // Disable button and show loading
    this.setLoading(true);

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save tokens
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));

      // Save username if remember me is checked
      if (remember) {
        localStorage.setItem('rememberedUsername', username);
      } else {
        localStorage.removeItem('rememberedUsername');
      }

      this.showMessage('Login successful! Redirecting...', 'success');

      // Redirect after 1 second
      setTimeout(() => {
        this.redirectToDashboard();
      }, 1000);

    } catch (error) {
      this.showMessage(error.message, 'error');
    } finally {
      this.setLoading(false);
    }
  }

  redirectToDashboard() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/';
    }
  }

  showMessage(message, type = 'info') {
    this.messageAlert.textContent = message;
    this.messageAlert.className = `message-alert ${type}`;
    this.messageAlert.style.display = 'block';

    if (type === 'success') {
      setTimeout(() => {
        this.messageAlert.style.display = 'none';
      }, 3000);
    }
  }

  setLoading(isLoading) {
    const loginText = document.getElementById('loginText');
    const spinner = document.getElementById('loadingSpinner');

    if (isLoading) {
      this.loginBtn.disabled = true;
      loginText.style.display = 'none';
      spinner.style.display = 'inline';
    } else {
      this.loginBtn.disabled = false;
      loginText.style.display = 'inline';
      spinner.style.display = 'none';
    }
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  new LoginManager();
});
