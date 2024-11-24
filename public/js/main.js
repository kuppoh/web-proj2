document.addEventListener('DOMContentLoaded', () => {
  // Ensure that edit buttons are visible and event listeners are attached
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.style.display = 'none'; // Initially hide the edit buttons
  });
});

function onSignIn() {
  // Simulate Google Sign-In
  console.log('User signed in.');

  // Show edit buttons and attach event listeners
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.style.display = 'block'; // Show edit buttons when signed in
    btn.addEventListener('click', toggleEdit); // Attach the click event listener
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
    btn.style.display = 'none'; // Hide edit buttons when signed out
    btn.removeEventListener('click', toggleEdit); // Remove the click event listener
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
      content.focus(); // Focus the content when it becomes editable
    }
  });

  if (button.textContent === 'Edit') {
    button.textContent = 'Save'; // Change button text to "Save"
  } else {
    button.textContent = 'Edit'; // Change button text back to "Edit"
    // Here, you can add code to save the changes to the server (e.g., using AJAX)
  }

  // Add a new list item if the parent contains a list and we are in "Save" mode
  const ul = parentDiv.querySelector('ul');
  if (ul && button.textContent === 'Save') {
    const newItem = document.createElement('li');
    newItem.className = 'editable-content';
    newItem.setAttribute('contenteditable', 'true');
    newItem.textContent = 'New item'; // Default text for new items
    ul.appendChild(newItem);
    newItem.focus(); // Focus the new list item to start editing
  }
}
