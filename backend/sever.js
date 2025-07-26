const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const axios = require('axios');


const app = express();
const upload = multer({ dest: 'data/uploaded_files/' });

const apiKey = '';
const instruction = `
You are an assistant that extracts structured course schedule data from university or college course plans.

Return a single valid JSON object in this format:

{
  "COURSE_ID": {
    "CourseName": "Full course name (e.g., Enterprise Java)",
    "Assignments": [
      {
        "Description": "Full name of the item (e.g., Assignment 1, Quiz 2, Final Exam)",
        "Type": "Assignment" | "Quiz" | "Test" | "Exam" | "Project" | "Participation" | "Lab",
        "Due Date": "YYYY-MM-DD (e.g., 2025-04-10), or empty string if not found",
        "Weight": "e.g., 15% or empty string if not found"
      }
    ]
  }
}

Instructions:
- Extract the COURSE_ID (e.g., SYST24444) and use it as the key.
- Extract the CourseName from anywhere in the document.
- Under Assignments, list every evaluative item (assignment, quiz, test, exam, project, participation, lab) with:
  - Description: use the exact item name (e.g., Assignment 1, Midterm Exam).
  - Type: infer based on keywords in the name.
  - Due Date: format as YYYY-MM-DD (e.g., 2025-04-10); convert if written in formats like "April 10", "Apr 10", "10-Apr", etc. If no date, leave as "".
  - Weight: keep as percentage (e.g., "15%") or "" if not found.
- Always include all known schedule items. If any field is missing, leave it as "".
- Do not include readings, topics, or lecture titles.
- Do not return explanations or text outside of the JSON object.
- Always return one complete JSON object, even if data is sparse.
`;

// Serve static files for the frontend
app.use(express.static(path.join(__dirname, '../frontend')));

async function extractPages(pdfBuffer) {
  const data = await pdfParse(pdfBuffer);
  const pages = data.text.split(/\f/); // Split by form feed char (page break)
  console.log('Extracted text from PDF:', pages); // Debugging log
  return pages.map(p => p.trim()).filter(p => p.length > 0);
}

async function processChunk(chunkText, pageNum) {
  const endpoint = 'https://api.openai.com/v1/chat/completions';

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };

  const data = {
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: instruction },
      { role: 'user', content: chunkText.slice(0, 8000) }
    ],
    temperature: 0.3
  };

  try {
    console.log(`📤 Sending data to ChatGPT for page ${pageNum}:`, data); // Debugging log
    const res = await axios.post(endpoint, data, { headers });
    const responseContent = res.data.choices[0].message.content;

    // Validate the response content
    if (!responseContent || !responseContent.trim().startsWith('{')) {
      console.error(`❌ Invalid response format for page ${pageNum}:`, responseContent);
      return null;
    }

    const result = JSON.parse(responseContent);

    // Validate required fields
    if (!result || typeof result !== 'object') {
      console.error(`❌ Invalid JSON structure for page ${pageNum}:`, result);
      return null;
    }

    const courseId = Object.keys(result)[0];
    const courseData = result[courseId];

    if (!courseData || !courseData.Assignments || !Array.isArray(courseData.Assignments)) {
      console.error(`❌ Missing or invalid Assignments for page ${pageNum}:`, courseData);
      return null;
    }

    console.log(`✅ Processed page ${pageNum}:`, result); // Debugging log

    // Transform the result to match the desired JSON structure
    const transformedResult = {};
    transformedResult[courseId] = {
      CourseName: courseData.CourseName || 'Unnamed Course',
      Assignments: courseData.Assignments.map(item => ({
        Description: item.Description || 'N/A',
        Type: item.Type || 'N/A',
        'Due Date': item['Due Date'] || '',
        Weight: item.Weight || ''
      }))
    };

    return transformedResult;
  } catch (err) {
    console.error(`❌ Error processing page ${pageNum}:`, err.response?.data || err.message);
    return null;
  }
}

async function saveToScheduleJson(data) {
  const outputPath = path.join(__dirname, '../data/output/schedule.json');
  const outputDir = path.dirname(outputPath);

  // Ensure the directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let existingData = {};

  // Read existing data if the file exists
  if (fs.existsSync(outputPath)) {
    const fileContent = fs.readFileSync(outputPath, 'utf-8');
    existingData = JSON.parse(fileContent);
  }

  // Merge the new data with the existing data
  Object.entries(data).forEach(([courseId, courseDetails]) => {
    existingData[courseId] = courseDetails;
  });

  // Write updated data back to the file
  fs.writeFileSync(outputPath, JSON.stringify(existingData, null, 2));
  console.log('✅ Data successfully saved to schedule.json');
}

app.post('/upload', upload.single('file'), async (req, res) => {
  const filePath = req.file?.path;
  const fileType = path.extname(req.file?.originalname || '').toLowerCase();

  try {
    if (!filePath || fileType !== '.pdf') {
      return res.status(400).json({ error: 'Unsupported file type. Only PDF files are allowed.' });
    }

    const buffer = fs.readFileSync(filePath);
    const pages = await extractPages(buffer);

    console.log(`✅ Loaded ${pages.length} pages\n`);

    let extractedData = {};

    for (let i = 0; i < pages.length; i++) {
      console.log(`📄 Sending Page ${i + 1} to ChatGPT...`);
      const result = await processChunk(pages[i], i + 1);

      if (result) {
        extractedData = { ...extractedData, ...result }; // Merge results from all pages
      } else {
        console.warn(`⚠️ No valid data extracted from page ${i + 1}`);
      }
    }

    if (Object.keys(extractedData).length > 0) {
      // Save the extracted data to schedule.json
      await saveToScheduleJson(extractedData);
      res.json({ message: 'File processed successfully!', data: extractedData });
    } else {
      res.status(400).json({ error: 'No valid data extracted from the file.' });
    }
  } catch (error) {
    console.error('Error processing file:', error.stack || error.message || error);
    res.status(500).json({ error: 'Failed to process the file.' });
  } finally {
    // Clean up uploaded file
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Uploaded file cleaned up.');
    }
  }
});

// Start the server
app.listen(4000, () => {
  console.log('Server is running on http://localhost:4000');
});
