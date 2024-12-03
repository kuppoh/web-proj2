document.addEventListener('DOMContentLoaded', () => {
  // Initially hide the edit buttons
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.style.display = 'none';
  });

  // Show edit buttons and set up event listeners based on the authentication state
  if (typeof isAuthenticated !== 'undefined' && isAuthenticated) {
    onSignIn();
  }

  // Handle modal form submission
  document.getElementById('edit-about-form')?.addEventListener('submit', async function(e) {
    e.preventDefault(); // Prevent the default form submission

    const updatedContent = {
      aboutMeDescription1: document.getElementById('aboutMeDescription1').value,
      aboutMeDescription2: document.getElementById('aboutMeDescription2').value
    };

    try {
      // Send the data via fetch to save it on the server
      const response = await fetch('/save-portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',  // Content type for JSON data
        },
        body: JSON.stringify(updatedContent),
      });

      const result = await response.json();  // Parse the response as JSON

      if (response.ok) {
        // Update the page content dynamically
        document.querySelector('p[name="aboutMeDescription1"]').textContent = updatedContent.aboutMeDescription1;
        document.querySelector('p[name="aboutMeDescription2"]').textContent = updatedContent.aboutMeDescription2;

        // Close the modal
        closeEditModal();
        alert('Portfolio saved successfully!');
      } else {
        alert('Error saving portfolio!');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error saving portfolio!');
    }
  });
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

    // Send the updated content to the server
    fetch('/save-portfolio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedContent)
    })
      .then(response => response.json())
      .then(data => {
        console.log('Saved successfully:', data);
      })
      .catch(error => {
        console.error('Error saving data:', error);
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

// Open the modal
function openEditModal() {
  document.getElementById('edit-modal').style.display = "block";
}

// Close the modal
function closeEditModal() {
  document.getElementById('edit-modal').style.display = "none";
}

// Close the modal when clicking outside the modal content
window.onclick = function(event) {
  if (event.target == document.getElementById('edit-modal')) {
    closeEditModal();
  }
}
