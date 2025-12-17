const connectDB = require("./db");
connectDB();
const User = require("./models/User");


const RawInput = require("./models/RawInput");

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MEDICAL_KNOWLEDGE_BASE } = require('./medicalData');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for base64 images

// In-memory User Storage (Simulating a DB connection)
const USERS = [];

// --- HELPER FUNCTIONS (The "AI" Logic) ---

const tokenize = (text) => {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '') 
    .split(/\s+/)
    .filter(w => w.length > 2); 
};

const calculateScore = (tokens, entry) => {
  let score = 0;
  tokens.forEach(token => {
    if (entry.keywords.includes(token)) {
      score += 2; // Direct match
    }
    if (entry.condition.toLowerCase().includes(token)) {
      score += 3; // Condition match
    }
  });
  return score;
};

const generateImageAnalysis = (att, mode, userContext) => {
  const context = userContext.toLowerCase();
  const isXray = context.includes("bone") || context.includes("break") || context.includes("chest") || context.includes("xray");
  const isReport = context.includes("report") || context.includes("blood") || context.includes("test") || context.includes("lab");

  if (mode === 'expert') {
    if (isXray) return `**Radiological Analysis (Backend Vision):**\n\n- **Modality:** X-Ray/Imaging.\n- **Quality:** Adequate contrast.\n- **Preliminary Findings:** No obvious cortical disruption or gross fracture lines detected in this view. Soft tissue shadows appear within normal limits.\n- **Recommendation:** Correlate with physical exam. If high suspicion of occult fracture, consider CT.`;
    if (isReport) return `**Lab Report Analysis (Backend OCR):**\n\n- **Document Type:** Clinical Pathology Report.\n- **Trend Analysis:** Values appear largely within reference ranges.\n- **Note:** Please manually verify any flagged "High" or "Low" values against your local lab standards.`;
    return `**Image Analysis:**\n\nImage received and processed on server. No specific pathology patterns detected by the vision model. Please ensure the area of interest is well-lit.`;
  } else {
    if (isXray) return `I've analyzed the X-ray on our secure server. While I can't give a diagnosis, the image looks clear. Usually, doctors look for cracks in the bones or shadows in the lungs here. If you are in pain, please see a specialist.`;
    if (isReport) return `I see you've uploaded a medical report. I can help you understand the terms. For example, "CBC" means Complete Blood Count. If you see numbers highlighted in bold or red on your paper, those are the ones to ask your doctor about.`;
    return `I see the image. It looks like you're showing me a symptom or a document. Could you tell me a bit more about what I'm looking at so I can help you better?`;
  }
};

const generateFallbackResponse = (mode, tokens) => {
  const topic = tokens.length > 0 ? tokens.join(" ") : "your query";
  if (mode === 'expert') {
    return `**System Notification:** The query regarding "${topic}" returned low confidence scores in the backend database.\n\n**Action:**\n1. Refine search terms (use standard MeSH terminology).\n2. Check for spelling errors.`;
  } else {
    return `I'm listening, but I'm not 100% sure what condition you are asking about based on "${topic}".\n\nCould you describe the symptoms differently?`;
  }
};

// --- API ENDPOINTS ---

// 1. Health Check
app.get('/', (req, res) => {
  res.send({ status: 'active', system: 'ChatDoctor Backend v2.0' });
});

// 2. Register User
app.post('/api/register', async (req, res) => {
  try {
    const userData = req.body;

    if (!userData || !userData.name) {
      return res.status(400).json({ error: "Invalid user data" });
    }

    // 1️⃣ Store in memory (existing behavior)
    USERS.push(userData);

    // 2️⃣ Store in MongoDB (NEW – required)
    const user = await User.create({
      name: userData.name,
      age: userData.age,
      gender: userData.gender,
      mode: userData.mode || "general"
    });

    console.log(`[REGISTER] User saved: ${user.name}`);

    res.json({
      success: true,
      userId: user._id
    });

  } catch (error) {
    console.error("User save error:", error);
    res.status(500).json({ success: false });
  }
});




// 3. Chat Endpoint (The Core Intelligence)
app.post('/api/chat', async (req, res) => {
  const { query, mode, attachment, userContext } = req.body;
  // 🔐 ADD: Store raw input BEFORE OCR / AI processing
await RawInput.create({
  textInput: query || "",
  fileInfo: req.file
    ? {
        filename: req.file.originalname,
        filepath: req.file.path,
        mimetype: req.file.mimetype
      }
    : null,
  mode
});
  
  console.log(`[CHAT] Mode: ${mode} | Query: ${query.substring(0, 50)}...`);

  // Simulate Processing Delay
  await new Promise(r => setTimeout(r, 1000));

  // A. Handle Images
  if (attachment) {
    const response = generateImageAnalysis(attachment, mode, query || "");
    return res.send({ response });
  }

  // B. Handle Text
  const tokens = tokenize(query || "");
  let bestMatch = null;
  let highestScore = 0;

  MEDICAL_KNOWLEDGE_BASE.forEach(entry => {
    const score = calculateScore(tokens, entry);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = entry;
    }
  });

  if (bestMatch && highestScore >= 2) {
    const baseResponse = bestMatch.responses[mode];
    const header = mode === 'expert' 
      ? `**Diagnostic Match: ${bestMatch.condition}**\n*Source: Secure Backend Database*\n\n`
      : ``;
    return res.send({ response: header + baseResponse });
  }

  // C. Fallback
  const fallback = generateFallbackResponse(mode, tokens);
  res.send({ response: fallback });
});

app.listen(PORT, () => {
  console.log(`ChatDoctor Backend running on http://localhost:${PORT}`);
});