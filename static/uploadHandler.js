document.getElementById('upload-form').addEventListener('submit', function (event) {
  event.preventDefault(); // Prevent the default form submission behavior

  const fileInput = document.getElementById('syllabus-upload'); // Get the file input element
  const file = fileInput.files[0]; // Get the selected file

  // Check if a file is selected
  if (!file) {
    alert('Please select a syllabus PDF to upload.');
    return;
  }

  // Log the file name (for debugging purposes)
  console.log('File selected:', file.name);

  // Redirect to the result page
  window.location.href = '/result.html';
});