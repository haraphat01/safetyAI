import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmergencyAnalysisRequest {
  userDescription: string;
  location?: string;
  medicalHistory?: string;
}

interface FirstAidRequest {
  emergencyType: string;
  specificInjury?: string;
  userLocation?: string;
}

interface VisionAnalysisRequest {
  imageBase64: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const { type, data } = await req.json()

    switch (type) {
      case 'emergency_analysis':
        return await handleEmergencyAnalysis(data as EmergencyAnalysisRequest, openaiApiKey)
      
      case 'first_aid_guidance':
        return await handleFirstAidGuidance(data as FirstAidRequest, openaiApiKey)
      
      case 'vision_analysis':
        return await handleVisionAnalysis(data as VisionAnalysisRequest, openaiApiKey)
      
      case 'emergency_conversation':
        return await handleEmergencyConversation(data, openaiApiKey)
      
      default:
        throw new Error(`Unknown analysis type: ${type}`)
    }

  } catch (error) {
    console.error('Error in AI analysis function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleEmergencyAnalysis(data: EmergencyAnalysisRequest, apiKey: string) {
  const { userDescription, location, medicalHistory } = data

  const prompt = buildEmergencyAnalysisPrompt(userDescription, location, medicalHistory)
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an emergency response AI assistant. Analyze emergency situations and provide concise, actionable summaries for emergency responders. Focus on:
1. Identifying the type of emergency
2. Assessing severity level (low/medium/high/critical)
3. Extracting key medical/contextual information
4. Providing clear, professional summaries
5. Suggesting immediate actions

Always prioritize safety and accuracy. If uncertain, err on the side of caution.

Respond in this exact JSON format:
{
  "severity": "low|medium|high|critical",
  "incidentType": "string",
  "summary": "string",
  "recommendedActions": ["string"],
  "confidence": 0.0-1.0
}`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const result = await response.json()
  const content = result.choices[0]?.message?.content || '{}'
  
  try {
    const analysis = JSON.parse(content)
    return new Response(
      JSON.stringify(analysis),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (parseError) {
    // Fallback parsing if JSON parsing fails
    const analysis = parseEmergencyAnalysis(content)
    return new Response(
      JSON.stringify(analysis),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleFirstAidGuidance(data: FirstAidRequest, apiKey: string) {
  const { emergencyType, specificInjury, userLocation } = data

  const prompt = buildFirstAidPrompt(emergencyType, specificInjury, userLocation)
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a certified first aid instructor providing step-by-step guidance. Provide:
1. Clear, numbered steps
2. Safety warnings
3. Time estimates
4. Clear indicators for when to call 911
5. Additional important notes

Always prioritize calling 911 for serious emergencies. Provide guidance that can be safely followed while waiting for professional help.

Respond in this exact JSON format:
{
  "steps": ["string"],
  "warnings": ["string"],
  "estimatedTime": "string",
  "whenToCall911": boolean,
  "additionalNotes": "string"
}`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 800,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const result = await response.json()
  const content = result.choices[0]?.message?.content || '{}'
  
  try {
    const guidance = JSON.parse(content)
    return new Response(
      JSON.stringify(guidance),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (parseError) {
    // Fallback parsing if JSON parsing fails
    const guidance = parseFirstAidGuidance(content)
    return new Response(
      JSON.stringify(guidance),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleVisionAnalysis(data: VisionAnalysisRequest, apiKey: string) {
  const { imageBase64 } = data

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a medical AI assistant analyzing injury images. Provide:
1. List of visible injuries
2. Severity assessment (minor/moderate/severe)
3. Immediate recommendations
4. Confidence level in your assessment

Always err on the side of caution. If injuries appear serious, recommend immediate medical attention.

Respond in this exact JSON format:
{
  "injuries": ["string"],
  "severity": "minor|moderate|severe",
  "recommendations": ["string"],
  "confidence": 0.0-1.0
}`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this injury image and provide medical assessment:'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 400,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const result = await response.json()
  const content = result.choices[0]?.message?.content || '{}'
  
  try {
    const analysis = JSON.parse(content)
    return new Response(
      JSON.stringify(analysis),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (parseError) {
    // Fallback parsing if JSON parsing fails
    const analysis = parseVisionAnalysis(content)
    return new Response(
      JSON.stringify(analysis),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

async function handleEmergencyConversation(data: any, apiKey: string) {
  const { userMessage, location, conversationHistory } = data

  // Compose the prompt for OpenAI
  const messages = [
    { role: 'system', content: 'You are a helpful, safety-focused assistant. Respond naturally and helpfully to the user\'s emergency or safety situation. If the user is in immediate danger or needs urgent medical help, remind them to call 911. Otherwise, provide calm, supportive, and practical advice.' },
    ...(conversationHistory || []),
    { role: 'user', content: userMessage + (location ? `\n\nLocation: ${location}` : '') }
  ]

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.4,
      max_tokens: 800,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const result = await response.json()
  const content = result.choices[0]?.message?.content || ''

  return new Response(
    JSON.stringify({ response: content }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  )
}

function buildEmergencyAnalysisPrompt(
  userDescription: string,
  location?: string,
  medicalHistory?: string
): string {
  let prompt = `Emergency Situation Analysis Request:

User Description: "${userDescription}"

Please analyze this emergency situation and provide:
1. Emergency type classification
2. Severity level (low/medium/high/critical)
3. Concise summary for emergency responders
4. Recommended immediate actions
5. Medical context considerations

`;

  if (location) {
    prompt += `Location Context: ${location}\n`;
  }

  if (medicalHistory) {
    prompt += `Medical History: ${medicalHistory}\n`;
  }

  prompt += `\nProvide your analysis in the specified JSON format.`;

  return prompt;
}

function buildFirstAidPrompt(
  emergencyType: string,
  specificInjury?: string,
  userLocation?: string
): string {
  let prompt = `First Aid Guidance Request:

Emergency Type: ${emergencyType}

Please provide step-by-step first aid guidance including:
1. Numbered steps to follow
2. Important safety warnings
3. Estimated time for each step
4. Clear indicators for when to call 911
5. Additional important notes

`;

  if (specificInjury) {
    prompt += `Specific Injury: ${specificInjury}\n`;
  }

  if (userLocation) {
    prompt += `Location: ${userLocation}\n`;
  }

  prompt += `\nProvide guidance that can be safely followed while waiting for professional medical help.`;

  return prompt;
}

function parseEmergencyAnalysis(content: string): any {
  const lines = content.split('\n');
  
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  let incidentType = 'Unknown';
  let summary = '';
  let recommendedActions: string[] = [];
  let confidence = 0.8;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('severity:') || lowerLine.includes('level:')) {
      if (lowerLine.includes('critical')) severity = 'critical';
      else if (lowerLine.includes('high')) severity = 'high';
      else if (lowerLine.includes('low')) severity = 'low';
      else severity = 'medium';
    }
    if (lowerLine.includes('type:') || lowerLine.includes('emergency:')) {
      incidentType = line.split(':')[1]?.trim() || 'Unknown';
    }
    if (lowerLine.includes('summary:') || lowerLine.includes('description:')) {
      summary = line.split(':')[1]?.trim() || '';
    }
    if (lowerLine.includes('action:') || lowerLine.includes('recommendation:')) {
      const action = line.split(':')[1]?.trim();
      if (action) recommendedActions.push(action);
    }
  }

  return {
    severity,
    incidentType,
    summary: summary || content.substring(0, 200),
    recommendedActions: recommendedActions.length > 0 ? recommendedActions : ['Call 911 if serious'],
    confidence,
  };
}

function parseFirstAidGuidance(content: string): any {
  const lines = content.split('\n');
  const steps: string[] = [];
  const warnings: string[] = [];
  let estimatedTime = '5-10 minutes';
  let whenToCall911 = false;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('step') || /^\d+\./.test(line)) {
      const step = line.replace(/^\d+\.\s*/, '').trim();
      if (step) steps.push(step);
    }
    if (lowerLine.includes('warning') || lowerLine.includes('caution')) {
      const warning = line.replace(/warning:|caution:/i, '').trim();
      if (warning) warnings.push(warning);
    }
    if (lowerLine.includes('call 911') || lowerLine.includes('emergency')) {
      whenToCall911 = true;
    }
  }

  return {
    steps: steps.length > 0 ? steps : ['Call 911 immediately'],
    warnings,
    estimatedTime,
    whenToCall911,
  };
}

function parseVisionAnalysis(content: string): any {
  const lines = content.split('\n');
  const injuries: string[] = [];
  let severity: 'minor' | 'moderate' | 'severe' = 'moderate';
  const recommendations: string[] = [];
  let confidence = 0.7;

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('injury') || lowerLine.includes('wound')) {
      const injury = line.replace(/injury:|wound:/i, '').trim();
      if (injury) injuries.push(injury);
    }
    if (lowerLine.includes('severity:')) {
      if (lowerLine.includes('severe')) severity = 'severe';
      else if (lowerLine.includes('minor')) severity = 'minor';
      else severity = 'moderate';
    }
    if (lowerLine.includes('recommend') || lowerLine.includes('suggest')) {
      const rec = line.replace(/recommendation:|suggestion:/i, '').trim();
      if (rec) recommendations.push(rec);
    }
  }

  return {
    injuries: injuries.length > 0 ? injuries : ['Unable to determine specific injuries'],
    severity,
    recommendations: recommendations.length > 0 ? recommendations : ['Seek medical attention'],
    confidence,
  };
} 