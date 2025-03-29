async function fetchCourseData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching course data:', error);
    return null;
  }
}

function parseDueDate(dueDate) {
  // Handle standard dates like "Sep 11"
  const standardDate = new Date(dueDate + " 2025"); // Append year for parsing
  if (!isNaN(standardDate)) {
    return standardDate;
  }

  // Handle "Week X" (e.g., "Week 14")
  const weekMatch = dueDate.match(/Week (\d+)/i);
  if (weekMatch) {
    const weekNumber = parseInt(weekMatch[1], 10);
    const startOfSemester = new Date("2025-09-01"); // Example semester start date
    const daysToAdd = (weekNumber - 1) * 7; // Each week has 7 days
    return new Date(startOfSemester.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  }

  // Return null for unrecognized formats
  return null;
}

function getUpcomingTasks(data) {
  const upcomingTasks = [];
  const currentDate = new Date();

  Object.entries(data).forEach(([courseCode, courseDetails]) => {
    const { CourseName, Assignments } = courseDetails;

    Assignments.forEach(assignment => {
      const dueDate = parseDueDate(assignment['Due Date']);
      if (dueDate && dueDate >= currentDate) {
        upcomingTasks.push({
          courseCode,
          courseName: CourseName,
          description: assignment['Description'],
          type: assignment['Type'],
          dueDate, // Keep as a Date object for sorting
          weight: assignment['Weight'],
        });
      }
    });
  });

  // Sort tasks by due date (earliest to latest)
  upcomingTasks.sort((a, b) => a.dueDate - b.dueDate);

  return upcomingTasks;
}

function renderUpcomingTasks(tasks, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = ''; // Clear existing content

  if (tasks.length === 0) {
    container.innerHTML = '<p>No upcoming tasks found.</p>';
    return;
  }

  tasks.forEach(task => {
    const taskElement = document.createElement('div');
    taskElement.className = 'task-card';

    taskElement.innerHTML = `
      <h3>${task.courseCode} - ${task.courseName}</h3>
      <p><strong>Task:</strong> ${task.description}</p>
      <p><strong>Type:</strong> ${task.type}</p>
      <p><strong>Due Date:</strong> ${task.dueDate.toDateString()}</p>
      <p><strong>Weight:</strong> ${task.weight}</p>
    `;

    container.appendChild(taskElement);
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  const data = await fetchCourseData('/static/course.json');
  if (data) {
    const upcomingTasks = getUpcomingTasks(data);
    renderUpcomingTasks(upcomingTasks, 'upcoming-tasks');
  }
});