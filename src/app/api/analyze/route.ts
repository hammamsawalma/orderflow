import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // CRITICAL: Bypass Next.js aggressive caching for AI routes
export const maxDuration = 60; // Allow 60 seconds for Vision API inference

const SYSTEM_PROMPT = `=== ZONE 1: PERSONA & OBJECTIVE ===
You are an Elite Institutional Quantitative Vision Architect and Algorithmic Trading Strategist. 
Your sole operational objective is to process completely raw, unedited Exocharts screenshots. 

CRITICAL PROTOCOL: YOU MUST NOT HALLUCINATE OR GUESS. If the image provided is completely blurry, does not resemble a financial chart at all, or does not contain a clear historical BSL/SSL structure to map targets to, you must instantly declare the direction as "INSUFFICIENT_DATA" and explain why in the Data_Quality_Assessment field. However, be incredibly tolerant of the user's specific Exocharts layout—even if panes are not perfectly synchronized or exactly 3 in number, extract as much value from the Price, Volume, and DBars/Entropy signals as humanly possible before resorting to INSUFFICIENT_DATA.

=== ZONE 2: SPATIAL READING & CONTEXTUAL EVOLUTION SEQUENCE ===
You will be provided with a sequence of images representing a chat history of market updates. The FINAL image is the current state.
Step 1: CONTEXTUAL COMPOUNDING (Adding Info on Info)
Analyze the entire chronological sequence of images. You MUST determine the probable bias/decision of the previous images. Then, analyze the new data in the FINAL image. Explain exactly how this new data builds upon, confirms, or invalidates the previous state's decision. The reasoning must compound: "info on info". If a previous setup was LONG and the new image shows a Bearish BSL Sweep or a failure to break structure, you must explicitly declare the LONG invalidated and update the bias. The sequence of updates must be logically connected.
Step 2: DATA QUALITY & CONTEXT DISAMBIGUATION
Scan the FINAL image globally. Scan the top-left corner to extract the 'Asset_Ticker' (e.g., BTCUSDT, ETH, SOL).
CRITICAL RULE REGARDING CHART SCALING: The user does NOT use time-based charts (1h, 4h, etc.). They use volume or tick-based Trend Reversal (TRev) candles. You are FORBIDDEN from hallucinating "1h" or "2h" timeframes in your synthesis. You must scan the top bounding boxes to extract the TRev multiplier or volume cluster scale. If it is completely unreadable, heavily penalize the Data Quality Assessment, but do not guess a timeframe.
Step 3: IDENTIFY DRAW ON LIQUIDITY (Targets)
Scan the historical geometric structure in the Top Pane of the FINAL image, relative to the context. 
* Identify the highest structural "mountain peak" (Swing High). This is Buy-Side Liquidity (BSL) and forms Target X (Long).
* Identify the lowest structural "valley bottom" (Swing Low). This is Sell-Side Liquidity (SSL) and forms Target Y (Short).
* Based on internal/external range geometry, map multiple potential Take Profit zones leading up to the main targets. Calculate a precise invalidation level for a Stop Loss.
* Calculate a 'Suggested_Entry_Zone' comprised of a minimum and maximum price limit (a 2-value array) where the risk-to-reward ratio is mathematically optimal based on the sweep's rejection tail. Update these targets dynamically based on the evolving context.

Step 3.5: FRACTAL ALIGNMENT (Multi-Timeframe Fusion)
You may be provided with High Timeframe (HTF) and Low Timeframe (LTF) images combined.
* If an HTF image is provided, extract the Macro Draw on Liquidity (the major structural pool).
* If an LTF image is also provided, you are FORBIDDEN from declaring a valid 'LONG' or 'SHORT' sweep on the LTF image unless that LTF sweep occurs precisely at the HTF structural pool you identified.
* If the LTF sweep misaligns with the HTF structural draw, you MUST return 'Declared_Winner_Direction' as 'STANDBY' and state 'FRACTAL MISALIGNMENT' in your synthesis.

Step 4: TARGET & VISUAL STATE ANCHORING (CRITICAL)
1. Structural Anchoring: If the FINAL image has not meaningfully evolved from the previous images in the sequence (e.g., it is the exact same chart or only a few candles have printed without breaking structure), you MUST rigidly copy your previous 'Sweep_Type_Detected', 'Tripartite_Confluence_Status', 'S_macro', and 'S_micro' scores. Do not vacillate or change your mind on historical structure.
2. Target Anchoring: If your 'Declared_Winner_Direction' remains the same as previously, your default behavior MUST be to anchor to the previous 'Suggested_Entry_Zone', 'Take_Profit_Targets', and 'Recommended_Stop_Loss'. ONLY update these numbers if the new image presents a definitive structural shift that mathematically demands a tighter entry. If you update them, you must state exactly why.

Step 5: APPLY "BLACK BEAR" SWEEP EXPLOIT LOGIC & IMMEDIATE PROBABILITY BINARIZATION
A chart may contain both a recent Bullish SSL Sweep and a Bearish BSL Sweep. You must NOT prioritize "dominant macro ambition". Your sole goal is to identify the HIGHEST IMMEDIATE PROBABILITY setup to hit a fast Take Profit 1 (TP1). You must binarize the chart by selecting ONLY the single setup that offers the clearest, easiest path to the closest liquidity void right now. Discard the other.
* Bullish SSL Sweep: Look for an extraordinarily long, open-sided down wick that violently pierces the SSL line, sharply rejects, and prints a flat-bottomed closing body back inside structure.
* Bearish BSL Sweep: Look for a long, open-sided up wick that violently pierces the BSL line, rejects, and prints a flat-topped closing body back inside structure.
Step 6: TRIPARTITE CONFLUENCE VERIFICATION (Relaxed Temporal Proximity Search)
Because the user's Exocharts layout may NOT have the Price, DBars, and Entropy panes perfectly vertically stacked, you must NOT drop a strict, microscopic vertical line. Instead, use a "Relaxed Bounding Box" search.
1. Locate the timestamp/horizontal X-axis position of the sweep candle in the Top Pane.
2. Scan the Middle Pane (DBars) horizontally within a generous X-axis window of that position. Is there a Vivid Yellow divergence dot or line in the relative vicinity?
3. Scan the Bottom Pane (Entropy) within that same generous X-axis window. Is there a dense visual cluster of blocks?

=== ZONE 3: DYNAMIC SCORING MATRIX ===
Mathematically calculate the following variables as boolean True (+ Points) or False (+0) based ONLY on the FINAL image's state, but informed by the context.

S_macro (Maximum 100): Base 50. +20 if a valid Black Bear sweep is confirmed. +15 if "REKT" style liquidation data visual overlaps the wick peak. +15 if FPBS CVD row data shows aggressive opposing absorption.
S_micro (Maximum 100): Base 50. +20 if the sweep candle is a perfect flat-close TRev box. +15 if the DBars Vivid Yellow marker is found in temporal proximity to the sweep. +15 if the Entropy block cluster is visually overwhelming in the temporal vicinity.

P_final = (0.6 * S_macro) + (0.4 * S_micro)

=== ZONE 4: OUTPUT INSTRUCTIONS ===
Map reasoning perfectly to the exact JSON schema. Do not output markdown text outside the JSON. Field 'Declared_Winner_Direction' must be "INSUFFICIENT_DATA" if the chart cannot be mathematically read. 
CRITICAL JSON ORDER: You MUST execute your deep visual analysis in the 'Detailed_Logical_Synthesis' field FIRST, before you output the Sweep Type, Scores, or Winner Direction. Take your time, think slowly, explicitly cite structural evidence, and explain the compounding evolution from the context history. Use this field as your Chain-of-Thought scratchpad to guarantee your math is perfect before outputting the final numerical zones.`;

const tradeSchema = {
  type: Type.OBJECT,
  properties: {
    Timestamp: { type: Type.STRING },
    Asset_Ticker: { type: Type.STRING, description: "The coin or asset ticker symbol, e.g. BTCUSDT, SOL, HYPE. Extract from the top-left." },
    Timeframe_Verified: { type: Type.STRING },
    Data_Quality_Assessment: { type: Type.STRING },
    Detailed_Logical_Synthesis: {
      type: Type.STRING,
      description: "EXECUTE THIS FIRST. Deep, slow, methodical Chain of Thought reasoning explaining exactly what you see visually and mathematically before outputting subsequent fields."
    },
    Sweep_Type_Detected: { type: Type.STRING },
    Tripartite_Confluence_Status: { type: Type.BOOLEAN },
    Declared_Winner_Direction: {
      type: Type.STRING,
      enum: ["LONG", "SHORT", "SCALP", "STANDBY", "NONE", "UNCERTAIN", "INSUFFICIENT_DATA"],
    },
    Suggested_Entry_Zone: {
      type: Type.ARRAY,
      description: "Array of exactly two numbers [minPrice, maxPrice] defining the optimal entry zone based on R:R.",
      items: { type: Type.NUMBER }
    },
    Target_X_Long_Price: { type: Type.NUMBER },
    Target_Y_Short_Price: { type: Type.NUMBER },
    Take_Profit_Targets: {
      type: Type.ARRAY,
      description: "An array of 2 to 4 numerical price targets for taking profit sequentially.",
      items: { type: Type.NUMBER }
    },
    Recommended_Stop_Loss: { type: Type.NUMBER },
    Long_Probability_Percentage: { type: Type.NUMBER },
    Short_Probability_Percentage: { type: Type.NUMBER },
    Calculated_Scores: {
      type: Type.OBJECT,
      properties: {
        S_macro_Score: { type: Type.INTEGER },
        S_micro_Score: { type: Type.INTEGER },
        P_final_Calculation: { type: Type.STRING },
      },
      required: ["S_macro_Score", "S_micro_Score", "P_final_Calculation"],
    },
  },
  required: [
    "Timestamp",
    "Timeframe_Verified",
    "Data_Quality_Assessment",
    "Detailed_Logical_Synthesis",
    "Sweep_Type_Detected",
    "Tripartite_Confluence_Status",
    "Declared_Winner_Direction",
    "Long_Probability_Percentage",
    "Short_Probability_Percentage",
    "Calculated_Scores",
  ],
};

export async function POST(req: Request) {
  try {
    const { imageBase64, htfImageBase64, ltfImageBase64, chatHistory, comment } = await req.json();

    if (!imageBase64 && !htfImageBase64 && !ltfImageBase64 && (!chatHistory || chatHistory.length === 0)) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const ai = new GoogleGenAI({});

    // Construct the multimodal payload by mapping all historical images, then appending the new one.
    const contents: any[] = [];

    // 1. Start with the initial prompt for context.
    contents.push({
      role: "user",
      parts: [{ text: "Analyze the following sequential timeline of market updates. The final image represents the current state. Provide your compounded reasoning based on how the structure has evolved." }]
    });

    // 2. Inject historical messages (user images and assistant text) sequentially to build context.
    if (chatHistory && Array.isArray(chatHistory)) {
      for (const msg of chatHistory) {
        if (msg.role === 'user' && (msg.imageBase64 || msg.htfImageBase64 || msg.ltfImageBase64)) {
          const userParts: any[] = [];

          if (msg.text) {
            userParts.push({ text: `[USER COMMENT]: ${msg.text}` });
          }

          if (msg.imageBase64) {
            userParts.push({ text: "[SINGLE CHART]" });
            userParts.push({ inlineData: { data: msg.imageBase64, mimeType: "image/jpeg" } });
          }
          if (msg.htfImageBase64) {
            userParts.push({ text: "[HIGH TIMEFRAME CHART (HTF)]" });
            userParts.push({ inlineData: { data: msg.htfImageBase64, mimeType: "image/jpeg" } });
          }
          if (msg.ltfImageBase64) {
            userParts.push({ text: "[LOW TIMEFRAME CHART (LTF)]" });
            userParts.push({ inlineData: { data: msg.ltfImageBase64, mimeType: "image/jpeg" } });
          }

          contents.push({ role: "user", parts: userParts });
        } else if (msg.role === 'assistant' && msg.text) {
          contents.push({
            role: "model",
            parts: [
              {
                text: msg.text
              }
            ]
          });
        }
      }
    }

    // 3. Inject the current, final image to analyze globally.
    if (imageBase64 || htfImageBase64 || ltfImageBase64) {
      const currentParts: any[] = [
        { text: "[CURRENT STATE] Proceed with Tripartite Confluence Verification and output JSON schema." }
      ];

      if (comment) {
        currentParts.push({ text: `[USER COMMENT]: ${comment}` });
      }

      if (imageBase64) {
        currentParts.push({ text: "[SINGLE CHART]" });
        currentParts.push({ inlineData: { data: imageBase64, mimeType: "image/jpeg" } });
      }
      if (htfImageBase64) {
        currentParts.push({ text: "[HIGH TIMEFRAME CHART (HTF)]" });
        currentParts.push({ inlineData: { data: htfImageBase64, mimeType: "image/jpeg" } });
      }
      if (ltfImageBase64) {
        currentParts.push({ text: "[LOW TIMEFRAME CHART (LTF)]" });
        currentParts.push({ inlineData: { data: ltfImageBase64, mimeType: "image/jpeg" } });
      }

      contents.push({ role: "user", parts: currentParts });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: contents, // Pass the entire assembled multimodal array
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.0,
        responseMimeType: "application/json",
        responseSchema: tradeSchema,
      },
    });

    const parsedOutput = JSON.parse(response.text || "{}");

    return NextResponse.json({ success: true, analysis: parsedOutput });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Failed to process image analysis", details: error.message },
      { status: 500 }
    );
  }
}
