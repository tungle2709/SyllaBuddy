async function fetchMultiCourseData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching multi-course data:', error);
    return null;
  }
}

function renderMultiCourseTables(data, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  Object.entries(data).forEach(([courseCode, courseDetails]) => {
    const { CourseName, Assignments } = courseDetails;

    const section = document.createElement('section');
    section.className = 'course-section';

    const headerWrapper = document.createElement('div');
    headerWrapper.className = 'section-header';

    const title = document.createElement('h2');
    title.innerText = `${courseCode} - ${CourseName}`;
    title.className = 'course-title';
    headerWrapper.appendChild(title);

    const editAllButton = document.createElement('button');
    editAllButton.innerText = 'Edit All';
    editAllButton.className = 'edit-all-button';
    headerWrapper.appendChild(editAllButton);

    section.appendChild(headerWrapper);

    const table = document.createElement('table');
    table.classList.add('assignment-table');

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    ['Description', 'Type', 'Due Date', 'Weight', 'Your %', 'Contribution to Final Grade'].forEach(h => {
      const th = document.createElement('th');
      th.innerText = h;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    let courseTotalContribution = 0; // To track the total contribution for this course

    Assignments.forEach(row => {
      const tr = document.createElement('tr');

      // Create editable cells for each field
      ['Description', 'Type', 'Due Date', 'Weight'].forEach(key => {
        const td = document.createElement('td');
        td.innerText = row[key] || '—';
        td.contentEditable = false; // Initially not editable
        td.classList.add('editable-cell');

        td.addEventListener('click', () => {
          if (td.contentEditable === 'true') {
            td.classList.add('selected-cell'); // Add the selected-cell class
          }
        });

        td.addEventListener('blur', () => {
          td.classList.remove('selected-cell'); // Remove the selected-cell class when the cell loses focus
        });

        tr.appendChild(td);
      });

      // Add input for user's percentage
      const inputTd = document.createElement('td');
      const input = document.createElement('input');
      input.type = 'number';
      input.min = 0;
      input.max = 100;
      input.placeholder = 'Enter %';
      input.className = 'user-percentage';
      inputTd.appendChild(input);
      tr.appendChild(inputTd);

      // Add cell for contribution to final grade
      const contributionTd = document.createElement('td');
      contributionTd.innerText = '—';
      tr.appendChild(contributionTd);

      // Update contribution when user inputs a percentage
      input.addEventListener('input', () => {
        const userPercentage = parseFloat(input.value) || 0;
        const weight = parseFloat(row['Weight'].replace('%', '')) || 0;
        const contribution = (userPercentage * weight) / 100;
        contributionTd.innerText = `${contribution.toFixed(2)}%`;

        // Recalculate total contribution for this course
        courseTotalContribution = Array.from(tbody.querySelectorAll('tr')).reduce((sum, tr) => {
          const contributionCell = tr.querySelector('td:last-child');
          const contributionValue = parseFloat(contributionCell.innerText.replace('%', '')) || 0;
          return sum + contributionValue;
        }, 0);

        totalContributionElement.innerHTML = `<strong>Final Grade for ${courseCode}:</strong> ${courseTotalContribution.toFixed(2)}%`;
      });

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    // Add total contribution row for this course
    const totalContributionElement = document.createElement('div');
    totalContributionElement.className = 'total-contribution stylish-box';
    totalContributionElement.innerHTML = `<strong>Final Grade for ${courseCode}:</strong> 0.00%`;
    section.appendChild(table);
    section.appendChild(totalContributionElement);

    // Handle Edit All button click
    editAllButton.addEventListener('click', () => {
      const isEditing = editAllButton.innerText === 'Save All';
      const editableCells = tbody.querySelectorAll('.editable-cell');

      if (isEditing) {
        // Save changes
        editableCells.forEach((cell, cellIndex) => {
          const rowIndex = Math.floor(cellIndex / 4); // Each row has 4 editable cells
          const key = ['Description', 'Type', 'Due Date', 'Weight'][cellIndex % 4];
          Assignments[rowIndex][key] = cell.innerText; // Update the row data
        });
        editAllButton.innerText = 'Edit All';
        editableCells.forEach(cell => (cell.contentEditable = false));
        table.classList.remove('edit-mode'); // Remove edit mode animation
      } else {
        // Enable editing
        editAllButton.innerText = 'Save All';
        editableCells.forEach(cell => (cell.contentEditable = true));
        table.classList.add('edit-mode'); // Add edit mode animation
      }
    });

    container.appendChild(section);
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  const data = await fetchMultiCourseData('static/course.json');
  if (data) {
    renderMultiCourseTables(data, 'dynamic-assignment-table');
  }
});