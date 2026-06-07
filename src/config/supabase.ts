import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nvofeoqsrjlzwvfknacp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52b2Zlb3Fzcmpsend2ZmtuYWNwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTk1MDA5NiwiZXhwIjoyMDk1NTI2MDk2fQ.QtPYoLfJyg-ypa8SzelBkuzhN-PKOojShKEO4mLdnPw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);