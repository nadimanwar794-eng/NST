
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ClassLevel, Subject, Chapter, LessonContent, Language, Board, Stream, ContentType, MCQItem, SystemSettings } from "../types";

// ============================================================================
// 🔑 MANUAL BACKUP KEY
const MANUAL_API_KEY = "AIzaSyCUvxGE45jnwMmQ4u-8L1NJowela6DckQo"; 
// ============================================================================

// Helper: Get available keys from System Settings + Env + Manual
const getAvailableKeys = (): string[] => {
    try {
        const storedSettings = localStorage.getItem('nst_system_settings');
        const keys: string[] = [];
        
        // 1. From Admin Settings
        if (storedSettings) {
            const parsed = JSON.parse(storedSettings) as SystemSettings;
            if (parsed.apiKeys && Array.isArray(parsed.apiKeys)) {
                parsed.apiKeys.forEach(k => { if(k.trim()) keys.push(k.trim()); });
            }
        }

        // 2. From Manual Constant
        if (MANUAL_API_KEY) keys.push(MANUAL_API_KEY);

        // 3. From Env
        const envKey = process.env.API_KEY;
        if (envKey && envKey !== 'DUMMY_KEY_FOR_BUILD') keys.push(envKey);

        // Remove duplicates
        return Array.from(new Set(keys));
    } catch (e) {
        return MANUAL_API_KEY ? [MANUAL_API_KEY] : [];
    }
};

// CRITICAL: Rotated Request Function
const executeWithRotation = async <T>(
    operation: (ai: GoogleGenAI) => Promise<T>
): Promise<T> => {
    const keys = getAvailableKeys();
    const shuffledKeys = keys.sort(() => 0.5 - Math.random());

    if (shuffledKeys.length === 0) {
        throw new Error("No API Keys available");
    }

    let lastError: any = null;

    for (const key of shuffledKeys) {
        try {
            const ai = new GoogleGenAI({ apiKey: key });
            return await operation(ai);
        } catch (error: any) {
            console.warn(`Key failed (ending in ...${key.slice(-4)}). Retrying...`, error.message);
            lastError = error;
        }
    }
    throw lastError || new Error("All API Keys failed.");
};


// Cache to avoid re-fetching chapters for the same session
const chapterCache: Record<string, Chapter[]> = {};
const lessonCache: Record<string, LessonContent> = {};

// Helper to remove markdown code blocks
const cleanJson = (text: string) => {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

// --- CUSTOM DB HELPERS ---
// Check if Admin has manually saved chapters for this specific configuration
const getCustomChapters = (key: string): Chapter[] | null => {
    try {
        const data = localStorage.getItem(`nst_custom_chapters_${key}`);
        return data ? JSON.parse(data) : null;
    } catch(e) { return null; }
};

// Check if Admin has manually saved content for a lesson
const getCustomLesson = (key: string): LessonContent | null => {
    try {
        const data = localStorage.getItem(`nst_custom_lesson_${key}`);
        return data ? JSON.parse(data) : null;
    } catch(e) { return null; }
};

// Helper to find ANY existing notes for context
const findExistingNotesContext = (
    board: Board, 
    classLevel: ClassLevel, 
    streamKey: string, 
    subjectName: string, 
    chapterId: string
): string | null => {
    const types: ContentType[] = ['NOTES_PREMIUM', 'NOTES_SIMPLE', 'PDF_NOTES'];
    
    for (const type of types) {
        const key = `${board}-${classLevel}${streamKey}-${subjectName}-${chapterId}-${type}`;
        // 1. Try Cache
        if (lessonCache[key]?.content) return lessonCache[key].content;
        
        // 2. Try LocalStorage (Admin Manual/Generated)
        const stored = localStorage.getItem(`nst_custom_lesson_${key}`);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.content) return parsed.content;
            } catch (e) {}
        }
    }
    return null;
};

// --- OFFLINE DATA GENERATORS (FALLBACK) ---
const getOfflineChapters = (subject: Subject): Chapter[] => {
    return [
        { id: 'ch-1', title: `Introduction to ${subject.name}`, description: "Basics and Fundamental Concepts." },
        { id: 'ch-2', title: "Core Principles", description: "Understanding the main theories." },
        { id: 'ch-3', title: "Advanced Theory", description: "Complex topics and deep dive." },
        { id: 'ch-4', title: "Practical Applications", description: "Real-world usage and case studies." },
        { id: 'ch-5', title: "Problem Solving", description: "Numerical and analytical problems." },
        { id: 'ch-6', title: "Summary & Revision", description: "Quick recap of the entire syllabus." },
        { id: 'ch-7', title: "Previous Year Questions", description: "Important questions from past exams." }
    ];
};

const getOfflineLesson = (subject: Subject, chapter: Chapter, type: ContentType): LessonContent => {
    const isMCQ = type.includes('MCQ');
    
    if (isMCQ) {
        return {
            id: Date.now().toString(),
            title: chapter.title,
            subtitle: `${subject.name} (Offline Mode)`,
            content: "MCQ_DATA_LOADED",
            type: type,
            dateCreated: new Date().toISOString(),
            subjectName: subject.name,
            mcqData: [
                { question: "What is the primary focus of this chapter?", options: ["Theory", "Practical", "History", "None"], correctAnswer: 0, explanation: "This chapter focuses on foundational theory." },
                { question: "Which concept is most important?", options: ["Concept A", "Concept B", "Concept C", "All of the above"], correctAnswer: 3, explanation: "All concepts are integral to understanding this topic." },
                { question: "True or False: This is an offline backup.", options: ["True", "False"], correctAnswer: 0, explanation: "The app is running in offline mode because the AI could not be reached." },
                { question: "What is the standard unit of measurement here?", options: ["Unit X", "Unit Y", "Unit Z", "None"], correctAnswer: 0, explanation: "Unit X is the standard international unit." },
                { question: "Who is the father of this subject?", options: ["Newton", "Einstein", "Darwin", "Unknown"], correctAnswer: 3, explanation: "Depends on the specific subject context." }
            ]
        };
    }

    return {
        id: Date.now().toString(),
        title: chapter.title,
        subtitle: `${subject.name} (Offline Mode)`,
        content: `# ${chapter.title}

> **Note:** You are viewing **Offline Notes**. The AI Server is currently unreachable.

## 1. Introduction
Welcome to the chapter on **${chapter.title}**. In this section, we will explore the fundamental aspects of **${subject.name}**. This topic is crucial for your board exams.

## 2. Key Concepts
*   **Definition:** The core idea behind this topic is to understand how systems interact.
*   **Significance:** Why do we study this? Because it forms the basis of advanced studies.
*   **Application:** Used in various real-world scenarios.

## 3. Detailed Explanation
When dealing with **${subject.name}**, it is important to remember the basic formulas and definitions.
- Point A: Essential for understanding.
- Point B: Builds upon Point A.
- Point C: The conclusion of the theory.

## 4. Important Formulas / Dates
*   Formula 1: $E = mc^2$ (Example)
*   Date: 1947 (Example)

## 5. Summary
To summarize, this chapter covers the basics. Please ensure you read your textbook for full details.`,
        type: type,
        dateCreated: new Date().toISOString(),
        subjectName: subject.name
    };
};

export const generateDevCode = async (userPrompt: string): Promise<string> => {
    try {
        return await executeWithRotation(async (ai) => {
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: userPrompt,
                config: { systemInstruction: "You are a React Developer. Output only code." }
            });
            return response.text || "// Error generating code";
        });
    } catch (error) {
        return "// Offline: AI Developer unavailable.";
    }
};

export const fetchChapters = async (
  board: Board,
  classLevel: ClassLevel, 
  stream: Stream | null,
  subject: Subject,
  language: Language
): Promise<Chapter[]> => {
  const streamKey = stream ? `-${stream}` : '';
  const cacheKey = `${board}-${classLevel}${streamKey}-${subject.name}-${language}`;
  
  // 1. CHECK CACHE
  if (chapterCache[cacheKey]) return chapterCache[cacheKey];

  // 2. CHECK MANUAL CUSTOM DATABASE (Admin Overrides)
  const customChapters = getCustomChapters(cacheKey);
  if (customChapters && customChapters.length > 0) {
      console.log("Loaded Chapters from Manual Database");
      chapterCache[cacheKey] = customChapters;
      return customChapters;
  }

  const prompt = `List 10 standard chapters for Class ${classLevel} ${stream ? stream : ''} Subject: ${subject.name} (${board}). Return JSON array: [{"title": "...", "description": "..."}].`;

  try {
    const data = await executeWithRotation(async (ai) => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json", temperature: 0.3 }
        });

        const text = response.text;
        if (!text) throw new Error("Empty response");
        return JSON.parse(cleanJson(text));
    });

    const chapters: Chapter[] = data.map((item: any, index: number) => ({
      id: `ch-${index + 1}`,
      title: item.title,
      description: item.description || ''
    }));

    chapterCache[cacheKey] = chapters;
    return chapters;

  } catch (error) {
    console.error("Fetch Chapters Failed (All keys exhausted), switching to Offline Mode:", error);
    const data = getOfflineChapters(subject);
    chapterCache[cacheKey] = data;
    return data;
  }
};

export const fetchLessonContent = async (
  board: Board,
  classLevel: ClassLevel,
  stream: Stream | null,
  subject: Subject,
  chapter: Chapter,
  language: Language,
  type: ContentType,
  existingMCQCount: number = 0,
  isPremium: boolean = false
): Promise<LessonContent> => {
  const streamKey = stream ? `-${stream}` : '';
  const cacheKey = `${board}-${classLevel}${streamKey}-${subject.name}-${chapter.id}-${language}-${type}-${existingMCQCount}`;
  
  // 1. CHECK CACHE (IN-MEMORY)
  if (lessonCache[cacheKey]) return lessonCache[cacheKey];

  // 2. CHECK MANUAL CUSTOM DATABASE (ADMIN SAVED NOTES)
  const manualStorageKey = `${board}-${classLevel}${streamKey}-${subject.name}-${chapter.id}-${type}`;
  const customContent = getCustomLesson(manualStorageKey);
  
  if (customContent) {
      console.log("Admin Content Found: Serving from Database (No Token Used)");
      
      const delay = Math.floor(Math.random() * 2000) + 2500;
      await new Promise(resolve => setTimeout(resolve, delay));

      lessonCache[cacheKey] = customContent;
      return customContent;
  }

  // 3. READ ADMIN CUSTOM PROMPT IF AVAILABLE
  let adminInstructions = '';
  try {
      const storedSettings = localStorage.getItem('nst_system_settings');
      if (storedSettings) {
          const parsed = JSON.parse(storedSettings) as SystemSettings;
          if (parsed.noteGenerationPrompt && parsed.noteGenerationPrompt.trim().length > 10) {
              adminInstructions = `\n\nADMIN OVERRIDE INSTRUCTIONS (FOLLOW THESE FOR TONE/STYLE):\n${parsed.noteGenerationPrompt}\n\n`;
          }
      }
  } catch(e) {}

  // 4. GENERATE SPECIFIC PROMPT BASED ON TYPE
  let prompt = '';
  let contextNotes = '';

  // IF GENERATING MCQs, TRY TO FIND EXISTING NOTES FOR CONTEXT
  if (type.includes('MCQ')) {
      const foundNotes = findExistingNotesContext(board, classLevel, streamKey, subject.name, chapter.id);
      if (foundNotes && foundNotes.length > 50) {
          console.log("Found existing notes context for MCQ generation!");
          // Limit context to ~15000 chars to avoid token limits, prioritizing the beginning
          contextNotes = foundNotes.substring(0, 15000);
          if (foundNotes.startsWith('data:application/pdf')) {
             // If context is PDF base64, we ignore it here for text-only model or handle later if multimodal
             // For now, only text notes are used for simple text generation context.
             contextNotes = ''; 
          }
      }
  }
  
  if (type === 'MCQ_SIMPLE') {
      prompt = `Generate 5 standard-level MCQs for Class ${classLevel} ${subject.name} Chapter: "${chapter.title}". 
      Format: JSON Array [{question, options[], correctAnswer(int), explanation}]. 
      Language: ${language}. 
      Keep questions direct and factual. Use $$Formula$$ for math.
      
      ${contextNotes ? `IMPORTANT: Base the questions STRICTLY on the following notes content:\n\n${contextNotes}` : ''}`;

  } else if (type === 'MCQ_ANALYSIS') {
      prompt = `Generate 15 High-Quality, Conceptual MCQs for Class ${classLevel} ${subject.name} Chapter: "${chapter.title}". 
      Format: JSON Array [{question, options[], correctAnswer(int), explanation}]. 
      Language: ${language}. 
      Include critical thinking questions. Use $$Formula$$ for all math/chemistry expressions. Provide detailed explanations.
      
      ${contextNotes ? `IMPORTANT: Base the questions STRICTLY on the following notes content to ensure relevance:\n\n${contextNotes}` : ''}`;

  } else if (type === 'NOTES_SIMPLE') {
      prompt = `Create SIMPLE, CONCISE STUDY NOTES for Class ${classLevel} ${subject.name}, Chapter: "${chapter.title}".
      Language: ${language}.
      Structure:
      - Quick Summary
      - Main Points (Bulleted)
      - Important Definitions
      - 2-3 Key Examples
      
      Keep it easy to read for quick revision. Use $$Formula$$ for math.
      ${adminInstructions}`;
  } else {
      // NOTES_PREMIUM (Default fallback)
      // Make it look like a "PDF" document structure
      prompt = `Create ULTRA-PREMIUM, PUBLICATION-READY STUDY NOTES (PDF STYLE) for Class ${classLevel} ${subject.name}, Chapter: "${chapter.title}". 
       Language: ${language}.
       
       ${adminInstructions ? adminInstructions : 'Structure: Title Page, Introduction, Deep Dive Sections, Key Concepts Table, Diagram Placeholders, Summary, Exam Corner.'}

       STRICT FORMATTING RULES (YOU MUST FOLLOW THESE):
       1. Use clear Markdown headers (#, ##, ###).
       2. Use [[red|TEXT]] for WARNINGS, DATES, EXCEPTIONS.
       3. Use [[blue|TEXT]] for HEADINGS, KEYWORDS.
       4. Use [[green|TEXT]] for DEFINITIONS, EXAMPLES.
       5. Use [[IMAGE:Description]] for where a diagram should be.
       
       CRITICAL FOR CHEMISTRY/MATH:
       You MUST wrap ALL Chemical Formulas and Math Equations in double dollar signs ($$).
       Example: "$$ 2Mg + O_2 \\rightarrow 2MgO $$", "$$ H_2SO_4 $$", "$$ x^2 + y^2 = r^2 $$"
       
       Content Depth:
       - Explain concepts like a top-tier professor.
       - Use tables for comparisons.
       - Include a "Points to Remember" section at the end.
       
       The output should be so high quality that it can be directly printed as a PDF book.`;
  }

  const modelToUse = (type.includes('PREMIUM') || type === 'MCQ_ANALYSIS' || isPremium) ? 'gemini-3-pro-preview' : 'gemini-2.5-flash';
  
  console.log(`Generating content: ${type} using ${modelToUse}`);

  try {
    const text = await executeWithRotation(async (ai) => {
        const response = await ai.models.generateContent({
            model: modelToUse,
            contents: prompt,
            config: { 
                responseMimeType: type.includes('MCQ') ? "application/json" : "text/plain",
                temperature: 0.3 
            }
        });
        if (!response.text) throw new Error("No response text");
        return response.text;
    });

    let finalContent = text;
    let mcqData: MCQItem[] | undefined = undefined;

    if (type.includes('MCQ')) {
        mcqData = JSON.parse(cleanJson(text));
        finalContent = "MCQ_DATA_LOADED";
    }

    const content: LessonContent = {
      id: Date.now().toString(),
      title: chapter.title,
      subtitle: `${subject.name} - Class ${classLevel} (${type.replace('_', ' ')})`,
      content: finalContent,
      type: type,
      dateCreated: new Date().toISOString(),
      subjectName: subject.name,
      mcqData: mcqData
    };

    lessonCache[cacheKey] = content;
    return content;

  } catch (error) {
    console.error("Fetch Content Failed (All keys exhausted), switching to Offline Mode:", error);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Fake delay for offline mode too
    const content = getOfflineLesson(subject, chapter, type);
    lessonCache[cacheKey] = content;
    return content;
  }
};
