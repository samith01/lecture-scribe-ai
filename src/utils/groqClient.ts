import Groq from 'groq-sdk';

export const initializeGroq = () => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  
  if (!apiKey) {
    console.warn('Groq API key not found. Please set VITE_GROQ_API_KEY in your environment.');
    return null;
  }

  return new Groq({
    apiKey,
    dangerouslyAllowBrowser: true
    
  });
};

export const groq = initializeGroq();
