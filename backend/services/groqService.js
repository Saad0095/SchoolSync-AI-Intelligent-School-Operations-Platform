import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import logger from "../utils/logger.js";
import "dotenv/config";

// Singleton Groq client instance
let groqClient = null;

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "your_groq_api_key_here" || apiKey.includes("placeholder")) {
    return null;
  }
  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
};

// Singleton Gemini client instance
let genAIClient = null;

const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key_here" || apiKey.includes("placeholder")) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenerativeAI(apiKey);
  }
  return genAIClient;
};

/**
 * Fallback AI generation using Google Gemini with multi-model cascade
 */
export const generateWithGeminiFallback = async (prompt, systemInstruction = null) => {
  const genAI = getGeminiClient();
  if (!genAI) {
    logger.warn("Gemini API key not configured or invalid. Gemini fallback skipped.");
    return null;
  }

  const geminiModels = [
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
    "gemini-2.5-pro",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-1.5-flash",
  ];

  for (const modelName of geminiModels) {
    try {
      logger.info(`Attempting AI generation with Gemini model (${modelName})...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction || undefined,
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (text && text.trim()) {
        logger.info(`Gemini AI generation succeeded using model: ${modelName}`);
        return text;
      }
    } catch (error) {
      logger.warn(`Gemini model (${modelName}) failed or rate-limited: ${error.message}. Retrying next Gemini model...`);
    }
  }

  return null;
};

/**
 * Unified AI Generation: Tries Groq multi-models first, falls back to Gemini multi-models
 */
export const generateWithGroq = async (prompt, systemInstruction = null) => {
  const client = getGroqClient();

  if (client) {
    const primaryModel = process.env.GROQ_MODEL || "groq/compound";
    const groqFallbackModels = [
      primaryModel,
      "groq/compound",
      "openai/gpt-oss-120b",
      "openai/gpt-oss-20b",
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "qwen/qwen3.6-27b",
    ].filter((item, index, self) => self.indexOf(item) === index);

    for (const currentModel of groqFallbackModels) {
      try {
        const messages = [];
        if (systemInstruction) {
          messages.push({ role: "system", content: systemInstruction });
        }
        messages.push({ role: "user", content: prompt });

        const response = await client.chat.completions.create({
          model: currentModel,
          messages,
          temperature: 0.7,
          max_tokens: 2048,
        });

        const text = response.choices?.[0]?.message?.content || "";
        if (text && text.trim()) {
          return text;
        }
      } catch (error) {
        logger.warn(`Groq API error (${currentModel}): ${error.message}. Retrying next model...`);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  // If Groq models fail or client is missing, execute Gemini multi-model fallback chain
  logger.warn("Groq models exhausted or unavailable. Initiating Gemini multi-model fallback...");
  const geminiResult = await generateWithGeminiFallback(prompt, systemInstruction);

  if (geminiResult && geminiResult.trim()) {
    return geminiResult;
  }

  throw new Error("AI generation failed across all Groq and Gemini models. Please check API quota and credentials.");
};

export const generateReportCardRemark = async (studentName, subjectsAndMarks) => {
  try {
    const prompt = `
Student: ${studentName || "Unknown Student"}

Subjects and marks:
${subjectsAndMarks}

Write a short, 1-2 sentence remark focusing on strengths and improvement areas.
Keep it encouraging and personalized.
`;
    const systemInstruction = "You are a kind, concise, and experienced school teacher providing feedback.";
    return await generateWithGroq(prompt, systemInstruction);
  } catch (error) {
    logger.error(`Failed to generate report card remark: ${error.message}`);
    return "Consistently puts in good effort. Continue working hard to achieve higher performance.";
  }
};

export const generateStudyRecommendation = async (studentData) => {
  try {
    const prompt = `
Generate a personalized study recommendation for the following student based on their data.
Data: ${JSON.stringify(studentData)}

Format the response in clear Markdown with headers:
### Strengths
### Weaknesses
### Action Items
`;
    const systemInstruction = "You are an AI Study Advisor helping a student improve their academic performance.";
    return await generateWithGroq(prompt, systemInstruction);
  } catch (error) {
    logger.error(`Failed to generate study recommendation: ${error.message}`);
    return `### Strengths
- Good overall effort across core subjects.

### Weaknesses
- Needs targeted practice in revision and exam time management.

### Action Items
- Set a daily 45-minute study schedule.
- Focus on problem-solving exercises.`;
  }
};

export const generateTeacherContent = async (type, subject, grade, topic, language, bloomLevel, count) => {
  try {
    const instructions = {
      "lesson-plan": "You are an expert teacher creating a comprehensive lesson plan. Include objectives, materials, introduction, main activity, assessment, and conclusion.",
      "quiz": `You are an expert examiner. Generate ${count || 5} quiz questions with options and the correct answer. The questions should test at Bloom's level: ${bloomLevel || "Understanding"}.`,
      "homework": "You are a teacher creating a homework assignment. It should be engaging, age-appropriate, and reinforce classroom learning.",
      "explain": "You are a teacher explaining a complex topic simply and clearly to students.",
      "simplify": "You are a teacher. Simplify the given text so it is easy for a student to understand.",
      "translate": `You are an expert translator. Translate the given text to ${language || "English"}.`,
    };

    const systemInstruction = instructions[type] || "You are an expert teacher assistant.";
    const prompt = `
Task: Generate ${type}
Subject: ${subject || "General"}
Grade: ${grade || "General"}
Topic/Text: ${topic}
${language ? `Language: ${language}` : ""}
`;
    return await generateWithGroq(prompt, systemInstruction);
  } catch (error) {
    logger.error(`Failed to generate teacher content (${type}): ${error.message}`);
    throw error;
  }
};

export const generateCommunicationVariants = async (promptText, language, channels) => {
  try {
    const systemInstruction = "You are a School Administrator Communication Assistant. Generate appropriate communication variants based on the prompt.";
    const prompt = `
The administrator wants to communicate the following message:
"${promptText}"

Please generate the communication in ${language === "both" ? "English and Urdu" : language}.
Generate variants for the following channels: ${channels.join(", ")}.

Format the output strictly as a JSON object where keys are the channel names (e.g., 'circular', 'sms', 'whatsapp', 'email', 'teacherNotice', 'studentNotice', 'website', 'push') and values are the generated text. Do not include markdown code block backticks if possible, return raw JSON string.
`;
    const result = await generateWithGroq(prompt, systemInstruction);
    try {
      const cleaned = result.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned);
    } catch (err) {
      logger.error("Failed to parse AI response as JSON", err);
      const fallbackObj = {};
      channels.forEach((ch) => {
        fallbackObj[ch] = promptText;
      });
      return fallbackObj;
    }
  } catch (error) {
    logger.error(`Failed to generate communication variants: ${error.message}`);
    const fallbackObj = {};
    channels.forEach((ch) => {
      fallbackObj[ch] = promptText;
    });
    return fallbackObj;
  }
};
