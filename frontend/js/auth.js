// auth.js

// Function to handle login form submission
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Simulate an API call for authentication
    authenticateUser(username, password);
}

// Simulated function for user authentication
function authenticateUser(username, password) {
    // Normally, you would send a request to your backend API for authentication
    // For demonstration purposes, we'll use a hardcoded token
    const token = 'fake-jwt-token'; // replace with actual login logic
    tokenStorage(token);
}

// Function to store token in local storage
function tokenStorage(token) {
    localStorage.setItem('authToken', token);
    // Redirect to dashboard after successful login
    window.location.href = '/dashboard';
}

// Function to manage client information
function getClientInfo() {
    const token = localStorage.getItem('authToken');
    if (token) {
        // Fetch client information using the token
        // Implement actual fetch logic here
    } else {
        // Handle case when no token is found
        console.error('No valid token found. Please log in.');
    }
}

// Function to log out the user
function logout() {
    localStorage.removeItem('authToken');
    // Redirect to the login page
    window.location.href = '/login';
}

// Add event listener to login form
document.getElementById('loginForm').addEventListener('submit', handleLogin);
