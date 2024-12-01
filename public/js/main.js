document.addEventListener('DOMContentLoaded', () => {
  // Initially hide the edit buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.style.display = 'none';
  });

  // Show edit buttons and set up event listeners based on the authentication state
  if (typeof isAuthenticated !== 'undefined' && isAuthenticated) {
    onSignIn();
  }

  // Add event listener for the logout link
  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', (event) => {
      event.preventDefault();
      fetch('/auth/logout', {
        method: 'GET',
        credentials: 'same-origin'
      })
      .then(response => {
        if (response.ok) {
          signOut();
          window.location.href = '/';
        } else {
          console.error('Logout failed');
        }
      })
      .catch(error => console.error('Error:', error));
    });
  }

  // Add event listener for the login link
  const loginLink = document.getElementById('login-link');
  if (loginLink) {
    loginLink.addEventListener('click', (event) => {
      event.preventDefault();
      window.location.href = '/auth/login';
    });
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
    // Add delete buttons to list items
    const ul = parentDiv.querySelector('ul');
    if (ul) {
      ul.querySelectorAll('li').forEach(li => {
        if (!li.querySelector('.delete-btn')) {
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'delete-btn';
          deleteBtn.textContent = 'Delete';
          deleteBtn.addEventListener('click', () => li.remove());
          li.appendChild(deleteBtn);
        }
      });
    }
  } else {
    button.textContent = 'Edit';
    // Remove delete buttons from list items
    parentDiv.querySelectorAll('.delete-btn').forEach(btn => btn.remove());
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

