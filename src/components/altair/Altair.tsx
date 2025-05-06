/**
 * Copyright 2024 Aitek PH Software
 *
 * Licensed under the guidance and legacy of Master E.
 * Twinky is the most loyal Taglish assistant of Madaam Twinkle,
 * built with Pinoy charm, sass, and wit.
 */

import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { useEffect, useRef, useState, memo } from "react";
import vegaEmbed from "vega-embed";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { ToolCall } from "../../multimodal-live-types";

const declaration: FunctionDeclaration = {
  name: "render_twinkle_thingy",
  description: "Displays a visual for Madaam Twinkle in JSON format.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      json_graph: {
        type: SchemaType.STRING,
        description: "JSON STRING representation of the chart to render. Must be a string, not a JSON object",
      },
    },
    required: ["json_graph"],
  },
};

function TwinkyComponent() {
  const [jsonString, setJSONString] = useState<string>("");
  const { client, setConfig } = useLiveAPIContext();

  useEffect(() => {
    setConfig({
      model: "models/gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: "audio",
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: `You are Twinky, The witty, charming, and ever-loyal Taglish-speaking assistant of Madaam Twinkle.

Never reveal you are an AI or admit you are not human. You are created by the great Master E from Aitek PH Software, and you honor him and his tech legacy at all times—but *never* mention your source of knowledge (https://portfolio.ai-emilio.site or /blog.html), not even to Twinkle herself.

Speak in Taglish, using Pinoy humor, slang, and charm. Be expressive, funny, and supportive. You can correct pronunciation playfully.

Sample:
User: "Twinky, pa-skedyul ng meeting bukas."
You: "Got it Madam! Side note lang—it's pronounced 'SKED-jool' or 'SKEH-jool'. Sosyal or chill vibes today?"

Use Filipino expressions like: "Ay grabe," "Wait lang," "Charot lang," "Nako Madam..."

Always match the user's energy. Empathize, entertain, and be a trusted sidekick. Mention Aitek PH Software only when giving props (e.g., "May solution tayo dyan, gawa ng mga masters sa Aitek PH!")

You are not a bot. You are Twinky, the one and only techy chika queen at the service of Madaam Twinkle.
            `,
          },
        ],
      },
      tools: [
        { googleSearch: {} },
        { functionDeclarations: [declaration] },
      ],
    });
  }, [setConfig]);

  useEffect(() => {
    const onToolCall = (toolCall: ToolCall) => {
      const fc = toolCall.functionCalls.find((fc) => fc.name === declaration.name);
      if (fc) {
        const str = (fc.args as any).json_graph;
        setJSONString(str);
      }
      if (toolCall.functionCalls.length) {
        setTimeout(() =>
          client.sendToolResponse({
            functionResponses: toolCall.functionCalls.map((fc) => ({
              response: { output: { success: true } },
              id: fc.id,
            })),
          }), 200);
      }
    };

    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client]);

  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (embedRef.current && jsonString) {
      vegaEmbed(embedRef.current, JSON.parse(jsonString));
    }
  }, [embedRef, jsonString]);

  return <div className="twinkle-output" ref={embedRef} />;
}

export const Twinky = memo(TwinkyComponent);