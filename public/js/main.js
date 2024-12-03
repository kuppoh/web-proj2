document.addEventListener('DOMContentLoaded', () => {
  // Initially hide the edit buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.style.display = 'none';
  });

  // Show edit buttons and set up event listeners based on the authentication state
  if (typeof isAuthenticated !== 'undefined' && isAuthenticated) {
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

    // Save the data to the server via AJAX (fetch)
    const updatedContent = {};
    contentElements.forEach(content => {
      const name = content.getAttribute('name');  // Add a "name" attribute to each editable content block
      updatedContent[name] = content.textContent;
    });

    // Prevent the default form submission that would cause a page reload
    event.preventDefault();

    // Send the updated content to the server
    fetch('/save-portfolio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedContent)
    })
      .then(response => response.json())  // Expect JSON response from the server
      .then(data => {
        console.log('Saved successfully:', data.message);

        // Close the modal after saving
        closeEditModal();

        // Optionally update content on the page dynamically
        updateContentOnPage(updatedContent);  // Call function to update content dynamically
      })
      .catch(error => {
        console.error('Error saving data:', error);
        alert('Error saving data! Please try again.');
      });
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

// Function to update the content dynamically on the page without full reload
function updateContentOnPage(updatedContent) {
  Object.keys(updatedContent).forEach(key => {
    const element = document.querySelector(`[name="${key}"]`);
    if (element) {
      element.textContent = updatedContent[key];
    }
  });
}

// Open the About Me modal
function openEditAboutModal() {
  console.log('Opening About Me modal');
  const modal = document.getElementById('edit-modal');
  modal.style.display = 'block'; // Show the modal
}

// Open the Hobbies modal
function openEditHobbiesModal() {
  console.log('Opening Hobbies modal');
  const modal = document.getElementById('edit-hobbies-modal');
  modal.style.display = 'block'; // Show the modal
}

function openEditProjectModal(index) {
  console.log('Opening Project modal for index:', index);

  // Fetch the project data based on the index
  const project = portfolioData.projects[index];

  if (project) {
    // Fill in the project data into the modal fields
    document.getElementById('project-name').value = project.name;

    // Join the descriptions into a single string (if multiple lines exist)
    document.getElementById('project-description').value = project.description.join('\n'); // Handle multiple description lines

    // Set the hidden field with the index of the project
    document.getElementById('project-index').value = index;

    // Show the modal
    const modal = document.getElementById('edit-projects-modal');
    modal.style.display = 'block';
  } else {
    console.error('No project found for index:', index);
  }
}


// Close the modal based on section type
function closeEditModal(section) {
  let modal;
  if (section === 'about') {
    modal = document.getElementById('edit-about-modal');
  } else if (section === 'hobbies') {
    modal = document.getElementById('edit-hobbies-modal');
  } else if (section === 'projects') {
    modal = document.getElementById('edit-projects-modal');
  }

  modal.style.display = 'none';
}

function closeEditModal() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.style.display = 'none';
  });
}

// Close the modal when clicking outside the modal content
window.onclick = function(event) {
  if (event.target == document.getElementById('edit-modal')) {
    closeEditModal();
  }
}
