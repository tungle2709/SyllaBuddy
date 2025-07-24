# Syllabuddy AI

Syllabuddy AI is a web application that helps students organize their academic schedules by extracting structured data from syllabus documents. The system uses AI to parse PDF syllabi and generate a clean, organized schedule of assignments, quizzes, exams, and other tasks.


## Features

- **Upload Syllabus**: Upload PDF syllabus files to extract course schedules.
- **Auto-Schedule Tasks**: Automatically extract deadlines, assignments, and task descriptions using AI.
- **View Assignment Schedule**: Display a structured schedule of assignments and deadlines.
- **Upcoming Tasks**: View tasks grouped by week to stay on top of your workload.
- **Edit and Save**: Edit assignment details directly in the schedule and save changes.
- **Export Schedule**: Export the schedule for offline use or integration with calendar apps.


---

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or later)
- [npm](https://www.npmjs.com/) (Node Package Manager)

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/tungle2709/SyllaBuddy
   cd SyllaBuddy

2.Install dependencies:
 ```bash
  npm install
```

3.Start the server:
 ```bash
  node backend/sever.js
```

4.Open the application in your browser:
  http://localhost:4000


### Usage:

-   Upload a PDF syllabus file using the upload form.

-   Wait for the system to process the file. Once completed, you will be redirected to the Assignment Schedule page.

-   View Assignment Schedule

-   The Assignment Schedule page (result.html) displays a table of assignments, quizzes, exams, and other tasks for each course.

-   View Upcoming Tasks

-   The Upcoming Tasks page groups tasks by week and displays them in chronological order.

-   Edit and Save

-   On the Assignment Schedule page, you can edit assignment details directly in the table and save changes

***File Upload Requirements:
Supported File Types: PDF
File Size Limit: 10 MB

Content Requirements: The syllabus should include clear course names, assignment descriptions, due dates, and weights.

