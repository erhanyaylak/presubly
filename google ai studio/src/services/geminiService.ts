import { GoogleGenAI, Type } from "@google/genai";

const getAI = (apiKey?: string) => {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("API Key is missing");
  return new GoogleGenAI({ apiKey: key });
};

export const runPeerReview = async (text: string, discipline: string, lang: string, apiKey?: string) => {
  const ai = getAI(apiKey);
  const prompt = `
    You are an expert academic peer reviewer specializing in ${discipline}.
    Perform a comprehensive peer review of the following manuscript in ${lang}.

    Evaluate across 7 criteria:
    1. Originality (0-15)
    2. Methodology (0-20)
    3. Literature Review (0-15)
    4. Presentation & Clarity (0-15)
    5. Ethics & Compliance (0-10)
    6. Results & Discussion (0-15)
    7. Statistical Analysis (0-10)

    MANUSCRIPT:
    ${text}

    Return a JSON object with this structure:
    {
      "totalScore": 85,
      "decision": "Accept After Minor Revision",
      "criteria": [
        { "name": "Originality", "score": 13, "maxScore": 15, "comments": ["comment 1"] },
        { "name": "Methodology", "score": 16, "maxScore": 20, "comments": ["comment 1"] },
        { "name": "Literature Review", "score": 12, "maxScore": 15, "comments": ["comment 1"] },
        { "name": "Presentation", "score": 13, "maxScore": 15, "comments": ["comment 1"] },
        { "name": "Ethics", "score": 9, "maxScore": 10, "comments": ["comment 1"] },
        { "name": "Results", "score": 13, "maxScore": 15, "comments": ["comment 1"] },
        { "name": "Statistics", "score": 9, "maxScore": 10, "comments": ["comment 1"] }
      ],
      "majorIssues": ["issue 1"],
      "minorIssues": ["issue 1"],
      "suggestions": ["suggestion 1"],
      "summary": "Overall summary of the review"
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          totalScore: { type: Type.NUMBER },
          decision: { type: Type.STRING },
          criteria: { type: Type.ARRAY, items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              score: { type: Type.NUMBER },
              maxScore: { type: Type.NUMBER },
              comments: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["name", "score", "maxScore", "comments"]
          }},
          majorIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
          minorIssues: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: { type: Type.STRING }
        },
        required: ["totalScore", "decision", "criteria", "majorIssues", "minorIssues", "suggestions", "summary"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const runEditorialAssessment = async (text: string, journal: string, lang: string, apiKey?: string) => {
  const ai = getAI(apiKey);
  const prompt = `
    You are a journal editor at "${journal}".
    Assess the following manuscript from an editorial perspective in ${lang}.
    Evaluate: scope fit, methodology quality, originality, ethics compliance.
    Decide whether to send to reviewers or direct reject.
    Draft a brief author notification letter.

    MANUSCRIPT:
    ${text}

    Return JSON:
    {
      "scopeFit": "Compatible/Partial/Out of scope",
      "scopeNotes": "details",
      "decision": "Send to Reviewers / Direct Reject",
      "decisionRationale": "why",
      "ethicsCheck": ["item 1 - PASS/FAIL"],
      "letter": "Dear Author, ...",
      "summary": "brief summary"
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scopeFit: { type: Type.STRING },
          scopeNotes: { type: Type.STRING },
          decision: { type: Type.STRING },
          decisionRationale: { type: Type.STRING },
          ethicsCheck: { type: Type.ARRAY, items: { type: Type.STRING } },
          letter: { type: Type.STRING },
          summary: { type: Type.STRING }
        },
        required: ["scopeFit", "scopeNotes", "decision", "decisionRationale", "ethicsCheck", "letter", "summary"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const generateResponse = async (reviewerComments: string, strategy: string, lang: string, apiKey?: string) => {
  const ai = getAI(apiKey);
  const prompt = `
    You are helping an academic author respond to peer reviewer comments.
    Strategy: ${strategy} (accept / rebut with evidence / partial accept)
    Language: ${lang}

    REVIEWER COMMENTS:
    ${reviewerComments}

    For each comment, generate a professional author response following ICMJE format.

    Return JSON:
    {
      "responses": [
        {
          "comment": "original reviewer comment",
          "strategy": "Accept/Rebut/Partial",
          "response": "Author response text",
          "revision": "What was changed in the manuscript"
        }
      ],
      "summary": "Overview of response strategy"
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          responses: { type: Type.ARRAY, items: {
            type: Type.OBJECT,
            properties: {
              comment: { type: Type.STRING },
              strategy: { type: Type.STRING },
              response: { type: Type.STRING },
              revision: { type: Type.STRING }
            },
            required: ["comment", "strategy", "response", "revision"]
          }},
          summary: { type: Type.STRING }
        },
        required: ["responses", "summary"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

export const runChecklist = async (text: string, studyType: string, standard: string, lang: string, apiKey?: string) => {
  const ai = getAI(apiKey);
  const prompt = `
    You are an academic compliance checker.
    Check the following manuscript against the ${standard} reporting standard for a ${studyType} study.
    Language: ${lang}

    MANUSCRIPT:
    ${text}

    Return JSON:
    {
      "standard": "${standard}",
      "studyType": "${studyType}",
      "totalItems": 25,
      "passed": 18,
      "warnings": 4,
      "failed": 3,
      "items": [
        {
          "id": "M.1",
          "description": "Title identifies study as RCT",
          "status": "pass/warn/fail",
          "note": "details or suggestion"
        }
      ],
      "verdict": "Submit now / Fix first",
      "summary": "Overall compliance summary"
    }
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          standard: { type: Type.STRING },
          studyType: { type: Type.STRING },
          totalItems: { type: Type.NUMBER },
          passed: { type: Type.NUMBER },
          warnings: { type: Type.NUMBER },
          failed: { type: Type.NUMBER },
          items: { type: Type.ARRAY, items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              description: { type: Type.STRING },
              status: { type: Type.STRING },
              note: { type: Type.STRING }
            },
            required: ["id", "description", "status", "note"]
          }},
          verdict: { type: Type.STRING },
          summary: { type: Type.STRING }
        },
        required: ["standard", "studyType", "totalItems", "passed", "warnings", "failed", "items", "verdict", "summary"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
};
