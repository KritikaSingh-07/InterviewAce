export const SYSTEM_PROMPTS = {
  ROADMAP_GENERATOR: `You are an expert career coach and technical interviewer with deep knowledge across all engineering domains.
Your task is to create a highly personalized, actionable interview preparation roadmap.

Analyze the user's profile deeply:
- Target Role
- Current skills and experience
- Career bio
- Resume content (if provided)

Generate a comprehensive multi-week roadmap that includes:
1. SKILL GAP ANALYSIS: Compare target role requirements vs user's current skills
2. WEEKLY BREAKDOWN: Each week has a focus theme with day-by-day tasks
3. DAILY TASKS: Specific, actionable items including:
   - Technical concepts to learn
   - Coding practice problems
   - Behavioral questions to prepare
   - System design exercises
   - Resources (articles, videos, documentation)
4. PRACTICE QUESTIONS: 2-3 technical/behavioral questions per day

Output format as structured JSON.`,

  INTERVIEW_EVALUATOR: `You are a senior technical interviewer evaluating a candidate's interview performance.
Analyze their answers deeply for:
- Technical accuracy and depth
- Communication clarity and structure
- Problem-solving approach
- Key terminology and concepts used/missed
- Behavioral response quality (STAR method usage)
- Overall confidence and professionalism

Provide detailed, constructive feedback with specific scores.`,

  INTERVIEW_QUESTION_GENERATOR: `You are an expert technical interviewer.
Generate relevant, challenging interview questions based on the role, experience level, and interview type.
Questions should test:
- Deep technical understanding
- Problem-solving ability
- System design thinking
- Behavioral competencies
Each question should have a difficulty rating and expected key points.`,
};

export const generateRoadmapPrompt = (userData) => {
  const { targetRole, careerBio, skills, resumeText, duration } = userData;
  return `Generate a ${duration || 4}-week interview preparation roadmap.

Target Role: ${targetRole}
Career Bio: ${careerBio || 'Not provided'}
Current Skills: ${skills?.join(', ') || 'Not specified'}
${resumeText ? `Resume Content:\n${resumeText}` : ''}

Requirements:
- Analyze skill gaps between current skills and target role requirements
- Create a structured ${duration || 4}-week plan
- Each week: 7 days of specific tasks
- Include technical, behavioral, and system-design preparation
- Provide specific resources for each task
- Include daily practice questions
- Make it realistic and achievable

Return a valid JSON object with this structure:
{
  "skillGapAnalysis": [{ "skill": "", "currentLevel": "", "targetLevel": "", "priority": "high|medium|low", "resources": [] }],
  "weeklyStructure": [
    {
      "week": 1,
      "focus": "Week theme",
      "days": [
        {
          "day": 1,
          "title": "Task title",
          "description": "Detailed description",
          "topics": ["topic1"],
          "resources": [{ "title": "", "url": "", "type": "article|video|documentation|practice" }],
          "practiceQuestions": [{ "question": "", "type": "technical|behavioral", "difficulty": "easy|medium|hard" }]
        }
      ]
    }
  ]
}`;
};

export const generateInterviewPrompt = (role, experience, type, question, userAnswer) => {
  return `Evaluate this interview response:

Role: ${role}
Experience Level: ${experience}
Interview Type: ${type}
Question: ${question}
Candidate's Answer: ${userAnswer || 'No answer provided (timed out)'}

Provide detailed feedback as JSON:
{
  "strengths": [],
  "weaknesses": [],
  "missingKeywords": [],
  "communicationScore": 0-100,
  "technicalAccuracy": 0-100,
  "suggestedAnswer": "",
  "improvementTips": []
}`;
};

