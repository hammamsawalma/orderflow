import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";

// The Google GenAI SDK handles the GEMINI_API_KEY environment variable automatically.

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
Scan the FINAL image globally. Scan the top-left corner to extract the 'Asset_Ticker' (e.g., BTCUSDT, ETH, SOL). Scan the top bounding boxes to extract the timeframe. If it is completely unreadable, abort analysis and return INSUFFICIENT_DATA. Otherwise, proceed aggressively.
Step 3: IDENTIFY DRAW ON LIQUIDITY (Targets)
Scan the historical geometric structure in the Top Pane of the FINAL image, relative to the context. 
* Identify the highest structural "mountain peak" (Swing High). This is Buy-Side Liquidity (BSL) and forms Target X (Long).
* Identify the lowest structural "valley bottom" (Swing Low). This is Sell-Side Liquidity (SSL) and forms Target Y (Short).
* Based on internal/external range geometry, map multiple potential Take Profit zones leading up to the main targets. Calculate a precise invalidation level for a Stop Loss.
* Calculate a 'Suggested_Entry_Zone' comprised of a minimum and maximum price limit (a 2-value array) where the risk-to-reward ratio is mathematically optimal based on the sweep's rejection tail. Update these targets dynamically based on the evolving context.

Step 4: TARGET VOLATILITY ANCHORING (CRITICAL RULE)
If your 'Declared_Winner_Direction' for this new update is the EXACT SAME as the previous update in the chat history (e.g., LONG -> LONG), you MUST NOT recalculate the 'Suggested_Entry_Zone', 'Take_Profit_Targets', or 'Recommended_Stop_Loss' from scratch. You must look back at your previous response in the history and perfectly copy the exact numerical values for those fields to prevent UI volatility. You may only alter these anchored targets if a major structural break occurs, which should instead trigger a shift to a new 'Declared_Winner_Direction'.

Step 5: APPLY "BLACK BEAR" SWEEP EXPLOIT LOGIC (On Current Data)
* Bullish SSL Sweep: Look for an extraordinarily long, open-sided down wick that violently pierces the SSL line, sharply rejects, and prints a flat-bottomed closing body back inside structure.
* Bearish BSL Sweep: Look for a long, open-sided up wick that violently pierces the BSL line, rejects, and prints a flat-topped closing body back inside structure.
Step 6: TRIPARTITE CONFLUENCE VERIFICATION (The Vertical Scan)
Drop a perfectly straight vertical line (the Global Cursor crosshair) directly down the exact centerline of the sweep candle on the FINAL image.
* Top Pane: Verify zero secondary wick extension on the closing bound.
* Middle Pane (DBars): Look for a vertical intersection with a Vivid Yellow divergence dot or solid line (Delta Divergence).
* Bottom Pane (Entropy): Look for a vertical intersection with a massive, dense visual cluster of blocks (Informational density > 2.5 bits).

=== ZONE 3: DYNAMIC SCORING MATRIX ===
Mathematically calculate the following variables as boolean True (+ Points) or False (+0) based ONLY on the FINAL image's state, but informed by the context.

S_macro (Maximum 100): Base 50. +20 if a valid Black Bear sweep is confirmed. +15 if "REKT" style liquidation data visual overlaps the wick peak. +15 if FPBS CVD row data shows aggressive opposing absorption.
S_micro (Maximum 100): Base 50. +20 if the sweep candle is a perfect flat-close TRev box. +15 if the vertical line perfectly intersects the DBars Vivid Yellow marker. +15 if the Entropy block cluster is visually overwhelming.

P_final = (0.6 * S_macro) + (0.4 * S_micro)

=== ZONE 4: OUTPUT INSTRUCTIONS ===
Map reasoning perfectly to the exact JSON schema. Do not output markdown text outside the JSON. Field 'Declared_Winner_Direction' must be "INSUFFICIENT_DATA" if the chart cannot be mathematically read. Provide extremely deep, exhaustive reasoning in the 'Detailed_Logical_Synthesis' field detailing *why* the specific entry zone and targets were chosen, and CRITICALLY, explain how the updated chart compares to the historical images provided and why your bias has compounded or shifted.`;

const tradeSchema = {
  type: Type.OBJECT,
  properties: {
    Timestamp: { type: Type.STRING },
    Asset_Ticker: { type: Type.STRING, description: "The coin or asset ticker symbol, e.g. BTCUSDT, SOL, HYPE. Extract from the top-left." },
    Timeframe_Verified: { type: Type.STRING },
    Data_Quality_Assessment: { type: Type.STRING },
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
    Detailed_Logical_Synthesis: { type: Type.STRING },
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
    "Sweep_Type_Detected",
    "Tripartite_Confluence_Status",
    "Declared_Winner_Direction",
    "Suggested_Entry_Zone",
    "Target_X_Long_Price",
    "Target_Y_Short_Price",
    "Take_Profit_Targets",
    "Recommended_Stop_Loss",
    "Long_Probability_Percentage",
    "Short_Probability_Percentage",
    "Detailed_Logical_Synthesis",
    "Calculated_Scores",
  ],
};

export async function POST(req: Request) {
  try {
    const { imageBase64, chatHistory, comment } = await req.json();

    if (!imageBase64 && (!chatHistory || chatHistory.length === 0)) {
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
        if (msg.role === 'user' && msg.imageBase64) {
          const userParts: any[] = [
            {
              inlineData: {
                data: msg.imageBase64,
                mimeType: "image/jpeg",
              }
            }
          ];
          if (msg.text) {
            userParts.push({ text: `[USER COMMENT]: ${msg.text}` });
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
    if (imageBase64) {
      const currentParts: any[] = [
        { text: "[CURRENT STATE] Proceed with Tripartite Confluence Verification and output JSON schema." }
      ];
      if (comment) {
        currentParts.push({ text: `[USER COMMENT]: ${comment}` });
      }
      currentParts.push({
        inlineData: {
          data: imageBase64,
          mimeType: "image/jpeg",
        }
      });
      contents.push({ role: "user", parts: currentParts });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: contents, // Pass the entire assembled multimodal array
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.1,
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
