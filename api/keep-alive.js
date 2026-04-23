export default async function handler(request, response) {
  const SUPABASE_URL = "https://ptbciswzgeczryxjwvag.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0YmNpc3d6Z2VjenJ5eGp3dmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDI5ODMsImV4cCI6MjA5MTc3ODk4M30.TbM5C6950Si7qdEfQlD6fU9NPkLzJ1gyU6xEhn7tbRc";

  try {
    // Hacemos una petición simple a la API de Supabase para mantener la conexión activa
    const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=id&limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (res.ok) {
      return response.status(200).json({ 
        status: 'ok', 
        message: 'Supabase is awake',
        timestamp: new Date().toISOString()
      });
    } else {
      const errorText = await res.text();
      return response.status(500).json({ 
        status: 'error', 
        message: 'Failed to ping Supabase',
        details: errorText
      });
    }
  } catch (error) {
    return response.status(500).json({ 
      status: 'error', 
      message: error.message 
    });
  }
}
