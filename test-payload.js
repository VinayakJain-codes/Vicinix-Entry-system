const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if(k && v.length) env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const {data: students} = await supabase.from('students').select('*').limit(3);
  students.forEach(s => {
    const payload = {
      messaging_product: 'whatsapp',
      to: s.whatsapp_number,
      type: 'template',
      template: {
        name: env.WHATSAPP_TEMPLATE_NAME || 'entry',
        language: { code: 'en' },
        components: [
          {
            type: 'header',
            parameters: [{ type: 'image', image: { link: s.qr_url } }]
          },
          {
            type: 'body',
            parameters: [{ type: 'text', parameter_name: 'student_name', text: String(s.name) }]
          }
        ]
      }
    };
    console.log('Payload for', s.name, ':', JSON.stringify(payload, null, 2));
  });
}

run();
