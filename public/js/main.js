document.addEventListener('DOMContentLoaded', () => {
  // Initially hide the edit buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.style.display = 'none';
  });

  // Show edit buttons and set up event listeners based on the authentication state
  // We rely on the 'isAuthenticated' being passed from the server and set by the EJS view
  if (isAuthenticated) {
    onSignIn();
  }
});

function onSignIn() {
  console.log('User signed in.');

  // Show edit buttons and attach event listeners
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.style.display = 'block';
    btn.addEventListener('click', toggleEdit);
  });

  // Toggle login/logout links
  document.getElementById('login-link').style.display = 'none';
  document.getElementById('logout-link').style.display = 'block';
}

function signOut() {
  console.log('User signed out.');

  // Hide edit buttons and remove event listeners
  document.querySelectorAll('.edit-btn').forEach(btn => {
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
    // Save changes to the server (e.g., using AJAX)
    saveChangesToServer(contentElements);
  }

  // Add a new list item if the parent contains a list and we're in "Save" mode
  const ul = parentDiv.querySelector('ul');
  if (ul && button.textContent === 'Save') {
    const newItem = document.createElement('li');
    newItem.className = 'editable-content';
    newItem.setAttribute('contenteditable', 'true');
    newItem.textContent = 'New item';  // Placeholder text
    ul.appendChild(newItem);
    newItem.focus();
  }
}

// Save the edited content to the server (e.g., using AJAX)
function saveChangesToServer(contentElements) {
  contentElements.forEach(content => {
    const updatedContent = content.innerHTML; // Get the updated content
    console.log('Saving content:', updatedContent);

    // Perform AJAX call to save the content to the server
    fetch('/save-edited-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: updatedContent })
    })
    .then(response => response.json())
    .then(data => {
      console.log('Content saved:', data);
    })
    .catch(error => console.error('Error saving content:', error));
  });
}
