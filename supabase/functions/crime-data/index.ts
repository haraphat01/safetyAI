import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { latitude, longitude, radius = 1000, type = 'incidents' } = await req.json()

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get API key from environment
    const apiKey = Deno.env.get('CRIMEOMETER_API_KEY')
    
    if (!apiKey) {
      // Return mock data if no API key is configured
      return new Response(
        JSON.stringify(getMockCrimeData(latitude, longitude, radius)),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let url: string
    if (type === 'incidents') {
      url = `https://api.crimeometer.com/v1/incidents/raw-data-crime-data?lat=${latitude}&lon=${longitude}&distance=${radius}`
    } else if (type === 'safety-zones') {
      url = `https://api.crimeometer.com/v1/safety-zones?lat=${latitude}&lon=${longitude}`
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid type parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Crimeometer API error: ${response.status}`)
    }

    const data = await response.json()

    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in crime-data function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch crime data',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

function getMockCrimeData(latitude: number, longitude: number, radius: number) {
  const mockIncidents = [
    {
      id: 'mock-1',
      type: 'theft',
      description: 'Vehicle break-in reported',
      latitude: latitude + 0.001,
      longitude: longitude + 0.001,
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      severity: 'medium',
    },
    {
      id: 'mock-2',
      type: 'vandalism',
      description: 'Property damage incident',
      latitude: latitude - 0.002,
      longitude: longitude + 0.001,
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      severity: 'low',
    },
    {
      id: 'mock-3',
      type: 'assault',
      description: 'Assault incident reported',
      latitude: latitude + 0.003,
      longitude: longitude - 0.002,
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      severity: 'high',
    },
  ]

  return {
    incidents: mockIncidents,
    total: mockIncidents.length,
    radius: radius,
    location: { latitude, longitude },
  }
} 