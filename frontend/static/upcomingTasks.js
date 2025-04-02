async function fetchScheduleData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Fetched schedule data:', data); // Debug log
    return data;
  } catch (error) {
    console.error('Error fetching schedule data:', error);
    return [];
  }
}





function renderCurrentTime(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  function updateTime() {
    const options = { timeZone: 'America/Toronto', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', options);
    const date = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    container.textContent = `Current Time (EST): ${time} | Date: ${date}`;
  }

  updateTime();
  setInterval(updateTime, 1000);
}

// Parse custom date strings like "Jan08", "Apr-02", "April16"
function parseCustomDate(dateStr) {
  const currentYear = new Date().getFullYear();
  const formats = [
    `${dateStr} ${currentYear}`, // e.g., "Jan08 2025"
    `${dateStr.replace(/-/g, ' ')} ${currentYear}`, // e.g., "Apr 02 2025"
    `${dateStr.replace(/[^\w]/g, ' ')} ${currentYear}`, // e.g., "April 16 2025"
  ];

  for (const fmt of formats) {
    const parsedDate = new Date(fmt);
    if (!isNaN(parsedDate)) return parsedDate;
  }
  console.warn('Failed to parse date:', dateStr);
  return null; // fallback
}

function groupTasksByWeek(data) {
  const tasksByWeek = {};

  data.forEach(course => {
    const { course_name, course_id, schedule_items } = course;
    if (!Array.isArray(schedule_items)) return;

    schedule_items.forEach(item => {
      const dueDate = parseCustomDate(item.date);
      if (dueDate && !isNaN(dueDate)) {
        const currentDate = new Date();
        // Calculate week number relative to today
        const weekNumber = Math.max(1, Math.ceil((dueDate - currentDate) / (7 * 24 * 60 * 60 * 1000)) + 1);

        if (!tasksByWeek[weekNumber]) {
          tasksByWeek[weekNumber] = [];
        }

        tasksByWeek[weekNumber].push({
          courseName: course_name || 'Unnamed Course',
          courseId: course_id || 'No ID',
          name: item.name || 'N/A',
          type: item.type || 'N/A',
          dueDate,
          weight: item.weight || 'N/A',
        });
      }
    });
  });

  console.log('Grouped tasks by week:', tasksByWeek);
  return tasksByWeek;
}

function renderTasksByWeek(tasksByWeek, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = ''; // Clear existing content

  Object.entries(tasksByWeek)
    .sort((a, b) => a[0] - b[0])
    .forEach(([week, tasks]) => {
      const weekContainer = document.createElement('div');
      weekContainer.className = 'week-container';

      const weekHeader = document.createElement('h2');
      weekHeader.textContent = `Week ${week}`;
      weekContainer.appendChild(weekHeader);

      if (tasks.length === 0) {
        const noTasksMessage = document.createElement('p');
        noTasksMessage.textContent = 'No tasks for this week.';
        weekContainer.appendChild(noTasksMessage);
      } else {
        const taskList = document.createElement('ul');
        tasks.forEach(task => {
          const taskItem = document.createElement('li');
          taskItem.className = 'task-item';

          const taskDetails = document.createElement('span');
          taskDetails.innerHTML = `
            <strong>${task.courseName} (${task.courseId})</strong>: ${task.name} 
            (Due: ${task.dueDate.toDateString()}, Type: ${task.type}, Weight: ${task.weight})
          `;
          taskItem.appendChild(taskDetails);
          taskList.appendChild(taskItem);
        });
        weekContainer.appendChild(taskList);
      }

      container.appendChild(weekContainer);
    });
}

window.addEventListener('DOMContentLoaded', async () => {
  renderCurrentTime('current-time');
  const data = await fetchScheduleData('/data/output/schedule.json');
  if (data && Array.isArray(data)) {
    const tasksByWeek = groupTasksByWeek(data);
    renderTasksByWeek(tasksByWeek, 'weekly-tasks');
  }
});
