// Este archivo inicializa el cliente de Supabase
// Se asume que en el HTML correspondiente ya se ha cargado el script de Supabase via CDN:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

export const SUPABASE_URL = "https://ptbciswzgeczryxjwvag.supabase.co";
export const SUPABASE_KEY = "sb_publishable_51Njj_gV96OyHDCvOY7muQ_0vFM_gnH";

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
