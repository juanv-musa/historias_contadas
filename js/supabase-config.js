// Este archivo inicializa el cliente de Supabase
// Se asume que en el HTML correspondiente ya se ha cargado el script de Supabase via CDN:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

export const SUPABASE_URL = "https://ptbciswzgeczryxjwvag.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0YmNpc3d6Z2VjenJ5eGp3dmFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDI5ODMsImV4cCI6MjA5MTc3ODk4M30.TbM5C6950Si7qdEfQlD6fU9NPkLzJ1gyU6xEhn7tbRc";

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
