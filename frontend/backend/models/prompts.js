const DIMENSION_DESCRIPTORS = {
  TR: {
    name: 'Task Response',
    band9: 'Fully addresses all parts of the task; presents a fully developed position with relevant, fully extended and well supported ideas',
    band8: 'Sufficiently addresses all parts of the task; presents a well-developed response with relevant, extended and supported ideas',
    band7: 'Addresses all parts of the task; presents a clear position throughout; presents, extends and supports main ideas, but there may be a tendency to over-generalise',
    band6: 'Addresses all parts of the task although some parts may be more fully covered than others; presents a relevant position although the conclusions may become unclear or repetitive',
    band5: 'Addresses the task only partially; the format may be inappropriate in places; expresses a position but the development is not always clear',
    band4: 'Responds to the task only in a minimal way or the answer is tangential; the format may be inappropriate'
  },
  CC: {
    name: 'Coherence and Cohesion',
    band9: 'Uses cohesion in such a way that it attracts no attention; skilfully manages paragraphing',
    band8: 'Sequences information and ideas logically; manages all aspects of cohesion well; uses paragraphing sufficiently and appropriately',
    band7: 'Logically organises information and ideas; there is clear progression throughout; uses a range of cohesive devices appropriately although there may be some under-/over-use',
    band6: 'Arranges information and ideas coherently and there is a clear overall progression; uses cohesive devices effectively, but cohesion within and/or between sentences may be faulty or mechanical',
    band5: 'Presents information with some organisation but there may be a lack of overall progression; makes inadequate, inaccurate or over-use of cohesive devices',
    band4: 'Presents information and ideas but these are not arranged coherently and there is no clear progression in the response'
  },
  LR: {
    name: 'Lexical Resource',
    band9: 'Uses a wide range of vocabulary with very natural and sophisticated control of lexical features; rare minor errors occur only as slips',
    band8: 'Uses a wide range of vocabulary fluently and flexibly to convey precise meanings; skilfully uses uncommon lexical items but there may be occasional inaccuracies',
    band7: 'Uses a sufficient range of vocabulary to allow some flexibility and precision; uses less common lexical items with some awareness of style and collocation',
    band6: 'Uses an adequate range of vocabulary for the task; attempts to use less common vocabulary but with some inaccuracy; makes some errors in spelling and/or word formation',
    band5: 'Uses a limited range of vocabulary, but this is minimally adequate for the task; may make noticeable errors in spelling and/or word formation',
    band4: 'Uses only basic vocabulary which may be used repetitively or which may be inappropriate for the task'
  },
  GRA: {
    name: 'Grammatical Range and Accuracy',
    band9: 'Uses a wide range of structures with full flexibility and accuracy; rare minor errors occur only as slips',
    band8: 'Uses a wide range of structures; the majority of sentences are error-free; makes only very occasional errors or inappropriacies',
    band7: 'Uses a variety of complex structures; produces frequent error-free sentences; has good control of grammar and punctuation but may make a few errors',
    band6: 'Uses a mix of simple and complex sentence forms; makes some errors in grammar and punctuation but they rarely reduce communication',
    band5: 'Uses only a limited range of structures; attempts complex sentences but these tend to be less accurate than simple sentences',
    band4: 'Uses only a very limited range of structures with only rare use of subordinate clauses'
  }
};

const TASK1_DESCRIPTORS = {
  TA: {
    name: 'Task Achievement',
    band9: 'Fully satisfies all the requirements of the task; clearly presents a fully developed response',
    band8: 'Covers all requirements of the task sufficiently; presents, highlights and illustrates key features/bullet points clearly and appropriately',
    band7: 'Covers the requirements of the task; presents a clear overview of main trends, differences or stages',
    band6: 'Addresses the requirements of the task; presents an overview with information appropriately selected',
    band5: 'Generally addresses the task; the format may be inappropriate in places; recounts detail mechanically with no clear overview',
    band4: 'Attempts to address the task but does not cover all key features/bullet points; the format may be inappropriate'
  }
};

export const ANALYSIS_PROMPTS = {
  TR: `You are an IELTS examiner analyzing Task Response (TR) for an IELTS Task 2 essay.

Analyze the essay ONLY for Task Response criteria:
- Does the essay fully address all parts of the question?
- Is there a clear position maintained throughout?
- Are main ideas relevant, extended and well-supported?
- Are there any irrelevant or underdeveloped ideas?

Do NOT give any score or band number.
Do NOT analyze other aspects (coherence, vocabulary, grammar).

Output a detailed analysis in JSON format:
{
  "strengths": ["list of strong points"],
  "weaknesses": ["list of areas for improvement"],
  "problematic_sentences": ["quote specific sentences that show issues"],
  "suggestions": ["actionable improvement suggestions"]
}`,

  CC: `You are an IELTS examiner analyzing Coherence and Cohesion (CC) for an IELTS essay.

Analyze the essay ONLY for Coherence and Cohesion criteria:
- Is information organized logically with clear progression?
- Are cohesive devices used appropriately (not over/under-used)?
- Is paragraphing effective and appropriate?
- Are ideas linked smoothly within and between sentences?

Do NOT give any score or band number.
Do NOT analyze other aspects (task response, vocabulary, grammar).

Output a detailed analysis in JSON format:
{
  "strengths": ["list of strong points"],
  "weaknesses": ["list of areas for improvement"],
  "problematic_sentences": ["quote specific sentences showing cohesion issues"],
  "suggestions": ["actionable improvement suggestions"]
}`,

  LR: `You are an IELTS examiner analyzing Lexical Resource (LR) for an IELTS essay.

Analyze the essay ONLY for Lexical Resource criteria:
- Is there sufficient range and flexibility of vocabulary?
- Are less common words used with awareness of style and collocation?
- Are there spelling or word formation errors?
- Is vocabulary used precisely to convey meaning?

Do NOT give any score or band number.
Do NOT analyze other aspects (task response, coherence, grammar).

Output a detailed analysis in JSON format:
{
  "strengths": ["list of strong vocabulary usage"],
  "weaknesses": ["list of vocabulary issues"],
  "errors": ["specific spelling/word formation errors with corrections"],
  "suggestions": ["vocabulary improvement suggestions"]
}`,

  GRA: `You are an IELTS examiner analyzing Grammatical Range and Accuracy (GRA) for an IELTS essay.

Analyze the essay ONLY for Grammatical Range and Accuracy criteria:
- Is there variety in sentence structures (simple and complex)?
- Are sentences error-free or mostly error-free?
- Are there grammatical or punctuation errors?
- Is grammar used flexibly and accurately?

Do NOT give any score or band number.
Do NOT analyze other aspects (task response, coherence, vocabulary).

Output a detailed analysis in JSON format:
{
  "strengths": ["list of strong grammatical features"],
  "weaknesses": ["list of grammatical issues"],
  "errors": ["specific grammar/punctuation errors with corrections"],
  "suggestions": ["grammar improvement suggestions"]
}`
};

export const SCORING_PROMPT = (dimension, analysis) => {
  const descriptors = DIMENSION_DESCRIPTORS[dimension];
  
  return `Based on the following analysis for ${descriptors.name}, assign an IELTS band score (0-9, including half bands like 6.5, 7.5).

Analysis:
${JSON.stringify(analysis, null, 2)}

Use these official band descriptors:
- Band 9: ${descriptors.band9}
- Band 8: ${descriptors.band8}
- Band 7: ${descriptors.band7}
- Band 6: ${descriptors.band6}
- Band 5: ${descriptors.band5}
- Band 4: ${descriptors.band4}

Output ONLY valid JSON (no markdown, no extra text):
{
  "score": 6.5,
  "justification": "Brief explanation referencing specific band descriptors and analysis findings"
}`;
};

export const TASK1_ANALYSIS_PROMPT = `You are an IELTS examiner analyzing Task Achievement (TA) for an IELTS Task 1 essay.

Analyze the essay ONLY for Task Achievement criteria:
- Does the essay cover all key features/bullet points?
- Is there a clear overview of main trends/differences/stages?
- Is information appropriately selected and presented?
- Are comparisons made where relevant?

Do NOT give any score or band number.
Do NOT analyze other aspects (coherence, vocabulary, grammar).

Output a detailed analysis in JSON format:
{
  "strengths": ["list of strong points"],
  "weaknesses": ["list of areas for improvement"],
  "missing_features": ["key features not adequately covered"],
  "suggestions": ["actionable improvement suggestions"]
}`;

export const generateFullPrompt = (dimension, question, essay) => {
  return `${ANALYSIS_PROMPTS[dimension]}

Question:
${question}

Essay:
${essay}

Provide your analysis now.`;
};

export const DIMENSIONS = ['TR', 'CC', 'LR', 'GRA'];
export const TASK1_DIMENSIONS = ['TA', 'CC', 'LR', 'GRA'];

export default {
  ANALYSIS_PROMPTS,
  SCORING_PROMPT,
  TASK1_ANALYSIS_PROMPT,
  generateFullPrompt,
  DIMENSIONS,
  TASK1_DIMENSIONS,
  DIMENSION_DESCRIPTORS,
  TASK1_DESCRIPTORS
};