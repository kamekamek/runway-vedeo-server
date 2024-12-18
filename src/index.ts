#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;
if (!RUNWAY_API_KEY) {
  throw new Error("RUNWAY_API_KEY environment variable is required");
}

const server = new Server(
  {
    name: "runway-video-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_video",
        description: "Generate a video from an image using RunwayAPI",
        inputSchema: {
          type: "object",
          properties: {
            imageUrl: {
              type: "string",
              description: "URL of the input image",
            },
            promptText: {
              type: "string",
              description: "Optional prompt text for video generation",
            },
          },
          required: ["imageUrl"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "generate_video") {
    throw new McpError(ErrorCode.MethodNotFound, "Unknown tool");
  }

  const { imageUrl, promptText } = request.params.arguments as {
    imageUrl: string;
    promptText?: string;
  };

  try {
    // Start the video generation task
    const response = await axios.post(
      "https://api.runwayml.com/v1/image_to_video",
      {
        promptImage: imageUrl,
        promptText: promptText || "",
        model: "gen3a_turbo",
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RUNWAY_API_KEY}`,
        },
      }
    );

    const taskId = response.data.id;

    // Poll the task until it's complete
    let task;
    do {
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait for 10 seconds before polling
      const taskResponse = await axios.get(
        `https://api.runwayml.com/v1/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${RUNWAY_API_KEY}`,
          },
        }
      );
      task = taskResponse.data;
    } while (!["SUCCEEDED", "FAILED"].includes(task.status));

    if (task.status === "FAILED") {
      throw new Error("Video generation failed");
    }

    return {
      content: [
        {
          type: "text",
          text: `Video generated successfully. Output URL: ${task.output.videoUrl}`,
        },
      ],
    };
  } catch (error) {
    console.error("Error generating video:", error);
    throw new McpError(
      ErrorCode.InternalError,
      "Failed to generate video: " + (error as Error).message
    );
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Runway Video MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
