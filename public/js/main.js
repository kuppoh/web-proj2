document.addEventListener('DOMContentLoaded', () => {
  // Show edit buttons and set up event listeners immediately when the page loads
  showEditButtons();
});

function showEditButtons() {
  console.log('User signed in.');

  // Show edit buttons and attach event listeners
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.style.display = 'block'; // Make sure the button is visible
    btn.addEventListener('click', toggleEdit); // Attach the click event listener
  });

  // Set the login/logout links (assumed that the user is logged in by default in this version)
  document.getElementById('login-link').style.display = 'none';  // Hide login link
  document.getElementById('logout-link').style.display = 'block'; // Show logout link
}

function signOut() {
  console.log('User signed out.');

  // Hide edit buttons and remove event listeners
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.style.display = 'none';
    btn.removeEventListener('click', toggleEdit);
  });

  // Toggle login/logout links (this assumes user is now signed out)
  document.getElementById('login-link').style.display = 'block'; // Show login link
  document.getElementById('logout-link').style.display = 'none'; // Hide logout link
}

function toggleEdit(event) {
  const button = event.target;
  const parentDiv = button.closest('div');
  const contentElements = parentDiv.querySelectorAll('.editable-content');
  
  contentElements.forEach(content => {
    const isEditable = content.getAttribute('contenteditable') === 'true';
    content.setAttribute('contenteditable', !isEditable);  // Toggle contenteditable attribute
    if (!isEditable) {
      content.focus();
    }
  });

  if (button.textContent === 'Edit') {
    button.textContent = 'Save';  // Change button text to "Save"
  } else {
    button.textContent = 'Edit';  // Change button text back to "Edit"
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
