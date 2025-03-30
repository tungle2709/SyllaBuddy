document.getElementById("upload-form").addEventListener("submit", async function (e) {
  e.preventDefault(); // Prevent the default form submission

  const formData = new FormData();
  const fileInput = document.getElementById("syllabus-upload");
  formData.append("file", fileInput.files[0]);

  // Show the loading screen
  const loadingScreen = document.getElementById("loading-screen");
  loadingScreen.classList.add("active");

  try {
    const response = await fetch("http://localhost:4000/upload", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (response.ok) {
      alert("File processed successfully!");
      console.log(result.data); // Log the extracted data
      window.location.href = "/result.html"; // Redirect to the Schedule page
    } else {
      alert("Failed to process the file: " + result.error);
    }
  } catch (error) {
    console.error("Error uploading file:", error);
    alert("An error occurred while uploading the file.");
  } finally {
    loadingScreen.classList.remove("active");
  }
});