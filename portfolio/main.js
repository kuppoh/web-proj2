function onSignIn() {
  // Simulate Google Sign-In
  console.log('User signed in.');

  // Show edit buttons
  document.querySelectorAll('.edit-btn').forEach(btn => btn.style.display = 'block');

  // Toggle login/logout links
  document.getElementById('login-link').style.display = 'none';
  document.getElementById('logout-link').style.display = 'block';
}

function signOut() {
  // Simulate Google Sign-Out
  console.log('User signed out.');

  // Hide edit buttons
  document.querySelectorAll('.edit-btn').forEach(btn => btn.style.display = 'none');

  // Toggle login/logout links
  document.getElementById('login-link').style.display = 'block';
  document.getElementById('logout-link').style.display = 'none';
}