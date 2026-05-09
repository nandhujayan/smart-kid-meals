const key = "AIzaSyDmSxGJHYRoZCq7PCJ-5_iiEZzf-BwJY6s";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;

const payload = {
  systemInstruction: { parts: [{ text: "Return ONLY valid JSON. No markdown." }] },
  contents: [{ role: 'user', parts: [{ text: "Generate a mock meal JSON with fields: mealName, description, calories" }] }],
  generationConfig: { responseMimeType: 'application/json' }
};

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
}).then(r => r.json()).then(data => {
  console.log(JSON.stringify(data, null, 2));
}).catch(console.error);
