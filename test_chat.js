const fs = require('fs');

async function test() {
    const img1Path = '/Users/hammamsawalma/Desktop/ORDER FLOW BOT/Screenshot 2026-03-02 at 16.54.18.png';
    const img2Path = '/Users/hammamsawalma/Desktop/ORDER FLOW BOT/Screenshot 2026-03-02 at 17.45.16.png';

    console.log("Loading image 1 (History)...");
    const img1Base64 = fs.readFileSync(img1Path).toString('base64');
    console.log("Loading image 2 (Current State)...");
    const img2Base64 = fs.readFileSync(img2Path).toString('base64');

    const chatHistory = [
        {
            role: 'user',
            imageBase64: img1Base64
        }
    ];

    console.log("Sending request to http://localhost:3000/api/analyze...");
    try {
        const response = await fetch('http://localhost:3000/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                imageBase64: img2Base64,
                chatHistory: chatHistory
            })
        });

        const data = await response.json();
        console.log("\n=== GEMINI INFERENCE RESULT ===");
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Test failed:", e);
    }
}

test();
