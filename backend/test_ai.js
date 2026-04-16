const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function test() {
  try {
    const aiForm = new FormData();
    // Use an existing test file or something simple
    fs.writeFileSync('test.txt', 'This is a patient diagnosis for Mr. Dungar containing severe heart transplant condition and requiring treatment ASAP.');
    aiForm.append('files', fs.createReadStream('test.txt'));
    aiForm.append('hospital_verified', 'false');

    console.log("Sending...");
    const aiRes = await axios.post(`http://localhost:8001/verify`, aiForm, {
      headers: aiForm.getHeaders(),
      timeout: 5000,
    });
    console.log(aiRes.data);
  } catch (err) {
    console.error("ERROR:");
    console.error(err.response ? err.response.data : err.message);
  }
}
test();
