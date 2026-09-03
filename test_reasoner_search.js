const auth = require('./deepseek-auth.json');
const { solvePOW } = require('./lib/pow.js');

const headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'x-client-platform': 'web',
  'x-client-version': '2.0.0',
  'x-client-locale': 'ru',
  'x-client-timezone-offset': '14400',
  'x-app-version': '2.0.0',
  'Authorization': `Bearer ${auth.token}`,
  'x-hif-dliq': auth.hif_dliq || '',
  'x-hif-leim': auth.hif_leim || '',
  'Origin': 'https://chat.deepseek.com',
  'Referer': 'https://chat.deepseek.com/',
  'Cookie': auth.cookie,
  'Content-Type': 'application/json',
};

async function test() {
  // 1. Create PoW challenge
  const cr = await fetch('https://chat.deepseek.com/api/v0/chat/create_pow_challenge', {
    method: 'POST', headers, body: JSON.stringify({ target_path: '/api/v0/chat/completion' })
  });
  const chalText = await cr.text();
  console.log('PoW challenge:', cr.status);
  
  const chalJson = JSON.parse(chalText);
  const challenge = chalJson?.data?.biz_data?.challenge;
  if (!challenge) return console.log('No challenge');
  
  // 2. Create session
  const sr = await fetch('https://chat.deepseek.com/api/v0/chat_session/create', {
    method: 'POST', headers, body: '{}'
  });
  const sessionText = await sr.text();
  console.log('Session create:', sr.status);
  const sessionData = JSON.parse(sessionText);
  const sessionId = sessionData?.data?.biz_data?.chat_session?.id || sessionData?.data?.biz_data?.id;
  if (!sessionId) return console.log('No session id');
  
  // 3. Solve PoW and test completion with deepseek-reasoner-search config
  const answer = await solvePOW(challenge, auth.wasmUrl);
  
  const powB64 = Buffer.from(JSON.stringify({
    algorithm: challenge.algorithm, challenge: challenge.challenge,
    salt: challenge.salt, answer: answer,
    signature: challenge.signature, target_path: '/api/v0/chat/completion'
  })).toString('base64');
  
  const resp = await fetch('https://chat.deepseek.com/api/v0/chat/completion', {
    method: 'POST',
    headers: { ...headers, 'X-DS-PoW-Response': powB64 },
    body: JSON.stringify({
      chat_session_id: sessionId,
      parent_message_id: null,
      model_type: 'default',
      prompt: 'Hello, test message',
      ref_file_ids: [],
      thinking_enabled: true,
      search_enabled: true,
      action: null, preempt: false,
    })
  });
  
  console.log('Completion:', resp.status);
  const text = await resp.text();
  console.log('Response (first 5000 chars):', text.substring(0, 5000));
}

test().catch(console.error);