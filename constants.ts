import { Subject } from './types';

export const ADMIN_EMAIL = "nadiman0636indo@gmail.com";
export const SUPPORT_EMAIL = "nadimanwar794@gmail.com";

// Default Subjects (Fallback)
export const DEFAULT_SUBJECTS = {
  physics: { id: 'physics', name: 'Physics', icon: 'science', color: 'bg-blue-50 text-blue-600' },
  chemistry: { id: 'chemistry', name: 'Chemistry', icon: 'flask', color: 'bg-purple-50 text-purple-600' },
  biology: { id: 'biology', name: 'Biology', icon: 'bio', color: 'bg-green-50 text-green-600' },
  math: { id: 'math', name: 'Mathematics', icon: 'math', color: 'bg-emerald-50 text-emerald-600' },
  history: { id: 'history', name: 'History', icon: 'history', color: 'bg-rose-50 text-rose-600' },
  geography: { id: 'geography', name: 'Geography', icon: 'geo', color: 'bg-indigo-50 text-indigo-600' },
  polity: { id: 'polity', name: 'Political Science', icon: 'gov', color: 'bg-amber-50 text-amber-600' },
  economics: { id: 'economics', name: 'Economics', icon: 'social', color: 'bg-cyan-50 text-cyan-600' },
  sociology: { id: 'sociology', name: 'Sociology', icon: 'ppl', color: 'bg-pink-50 text-pink-600' },
  psychology: { id: 'psychology', name: 'Psychology', icon: 'mind', color: 'bg-fuchsia-50 text-fuchsia-600' },
  accounts: { id: 'accounts', name: 'Accountancy', icon: 'accounts', color: 'bg-blue-50 text-blue-700' },
  bst: { id: 'bst', name: 'Business Studies', icon: 'business', color: 'bg-teal-50 text-teal-600' },
  english: { id: 'english', name: 'English', icon: 'english', color: 'bg-slate-50 text-slate-700' },
  hindi: { id: 'hindi', name: 'Hindi (हिंदी)', icon: 'hindi', color: 'bg-orange-50 text-orange-600' },
  sanskrit: { id: 'sanskrit', name: 'Sanskrit (संस्कृत)', icon: 'book', color: 'bg-yellow-50 text-yellow-600' },
  computer: { id: 'computer', name: 'Computer Science', icon: 'computer', color: 'bg-violet-50 text-violet-600' },
  ip: { id: 'ip', name: 'Info. Practices (IP)', icon: 'computer', color: 'bg-violet-50 text-violet-600' },
  pe: { id: 'pe', name: 'Physical Education', icon: 'active', color: 'bg-lime-50 text-lime-600' },
  science: { id: 'science', name: 'Science', icon: 'science', color: 'bg-blue-50 text-blue-600' },
  sst: { id: 'sst', name: 'Social Science', icon: 'geo', color: 'bg-orange-50 text-orange-600' },
  home_sc: { id: 'home_sc', name: 'Home Science', icon: 'home', color: 'bg-red-50 text-red-500' }
};

// Helper to get subjects - NOW DYNAMIC
export const getSubjectsList = (classLevel: string, stream: string | null): Subject[] => {
  const isSenior = ['11', '12'].includes(classLevel);

  // 1. Try to load Custom Subjects from LocalStorage
  let pool = { ...DEFAULT_SUBJECTS };
  try {
      const stored = localStorage.getItem('nst_custom_subjects_pool');
      if (stored) {
          pool = JSON.parse(stored);
      }
  } catch (e) {
      console.error("Error loading dynamic subjects", e);
  }

  // 2. Logic to filter based on Class/Stream
  // Note: For fully dynamic custom subjects added by Admin, we usually default them to show for everyone
  // or logic needs to be expanded. For now, we map core keys, and append any "custom" keys found in storage.
  
  const allKeys = Object.keys(pool);
  const coreKeys = Object.keys(DEFAULT_SUBJECTS);
  const customKeys = allKeys.filter(k => !coreKeys.includes(k)); // Subjects added by Admin manually

  let selectedSubjects: Subject[] = [];

  // --- JUNIOR CLASSES (6-10) ---
  if (!isSenior) {
      selectedSubjects = [
          pool.math,
          pool.science,
          pool.sst,
          pool.english,
          pool.hindi,
          pool.sanskrit,
          pool.computer,
          pool.pe
      ].filter(Boolean); // Remove undefined if deleted
  } 
  // --- SENIOR CLASSES (11/12) ---
  else {
      if (stream === 'Science') {
          selectedSubjects = [pool.physics, pool.chemistry, pool.math, pool.biology, pool.english, pool.hindi, pool.computer, pool.pe, pool.economics];
      } else if (stream === 'Commerce') {
          selectedSubjects = [pool.accounts, pool.bst, pool.economics, pool.math, pool.english, pool.hindi, pool.ip, pool.pe];
      } else if (stream === 'Arts') {
          selectedSubjects = [pool.history, pool.geography, pool.polity, pool.economics, pool.sociology, pool.psychology, pool.english, pool.hindi, pool.sanskrit, pool.pe, pool.home_sc];
      }
      selectedSubjects = selectedSubjects.filter(Boolean);
  }

  // 3. APPEND CUSTOM SUBJECTS (Admin Added)
  // If admin added "Robotics", it shows for everyone for now (simplification)
  customKeys.forEach(key => {
      if (pool[key]) selectedSubjects.push(pool[key]);
  });

  return selectedSubjects;
};
