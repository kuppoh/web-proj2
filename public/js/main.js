document.addEventListener('DOMContentLoaded', () => {
  // Initially hide the edit buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.style.display = 'none';
  });

  // Check if the user is already signed in (if applicable)
  if (isUserSignedIn()) {
    onSignIn();
  }
});

function onSignIn() {
  // Simulate Google Sign-In
  console.log('User signed in.');

  // Show edit buttons and attach event listeners
  document.querySelectorAll('.edit-btn').forEach(btn => {
    console.log('Showing edit button:', btn); // Debug log
    btn.style.display = 'block';
    btn.addEventListener('click', toggleEdit);
  });

  // Toggle login/logout links
  document.getElementById('login-link').style.display = 'none';
  document.getElementById('logout-link').style.display = 'block';
}

function signOut() {
  // Simulate Google Sign-Out
  console.log('User signed out.');

  // Hide edit buttons and remove event listeners
  document.querySelectorAll('.edit-btn').forEach(btn => {
    console.log('Hiding edit button:', btn); // Debug log
    btn.style.display = 'none';
    btn.removeEventListener('click', toggleEdit);
  });

  // Toggle login/logout links
  document.getElementById('login-link').style.display = 'block';
  document.getElementById('logout-link').style.display = 'none';
}

function toggleEdit(event) {
  const button = event.target;
  const parentDiv = button.closest('div');
  const contentElements = parentDiv.querySelectorAll('.editable-content');
  
  contentElements.forEach(content => {
    const isEditable = content.getAttribute('contenteditable') === 'true';
    content.setAttribute('contenteditable', !isEditable);
    if (!isEditable) {
      content.focus();
    }
  });

  if (button.textContent === 'Edit') {
    button.textContent = 'Save';
  } else {
    button.textContent = 'Edit';
    // Here, you can add code to save the changes to the server (e.g., using AJAX)
  }

  // Add a new list item if the parent contains a list and we are in "Save" mode
  const ul = parentDiv.querySelector('ul');
  if (ul && button.textContent === 'Save') {
    const newItem = document.createElement('li');
    newItem.className = 'editable-content';
    newItem.setAttribute('contenteditable', 'true');
    newItem.textContent = 'New item';
    ul.appendChild(newItem);
    newItem.focus();
  }
}

// Helper function to check if the user is signed in
function isUserSignedIn() {
  // Implement your logic to check if the user is signed in
  // For example, check a cookie or local storage
  return false; // Change this to your actual logic
}