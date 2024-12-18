#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import RunwayML from '@runwayml/sdk';
import fs from "fs";
import path from "path";
import mime from 'mime-types';

const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY;
if (!RUNWAY_API_KEY) {
  throw new Error("RUNWAY_API_KEY is not set in the @claude_desktop_config.json file");
}

const client = new RunwayML();

const server = new Server(
  {
    name: "runway-video-server",
    version: "0.1.7",
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
            image: {
              type: "string",
              description: "URL of the input image, Base64 encoded image data, or path to local image file",
            },
            promptText: {
              type: "string",
              description: "Optional prompt text for video generation",
            },
          },
          required: ["image"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "generate_video") {
    throw new McpError(ErrorCode.MethodNotFound, "Unknown tool");
  }

  const { image, promptText } = request.params.arguments as {
    image: string;
    promptText?: string;
  };

  try {
    let promptImage = image;

    if (image.startsWith("http://") || image.startsWith("https://")) {
      // Image URL, use as is
      console.log("Using image URL:", image);
    } else if (image.startsWith("data:")) {
      // Base64 encoded image data, use as is
      console.log("Using Base64 encoded image data");
    } else {
      // Assume it's a local file path
      const absolutePath = path.isAbsolute(image) ? image : path.resolve(process.cwd(), image);
      console.log("Reading local file:", absolutePath);
      const imageBuffer = fs.readFileSync(absolutePath);
      const base64Image = imageBuffer.toString("base64");
      const mimeType = mime.lookup(absolutePath) || 'application/octet-stream';
      promptImage = `data:${mimeType};base64,${base64Image}`;
    }

    console.log("Creating image-to-video task");
    const imageToVideo = await client.imageToVideo.create({
      model: 'gen3a_turbo',
      promptImage: promptImage,
      promptText: promptText || "",
    });

    const taskId = imageToVideo.id;
    console.log("Task created with ID:", taskId);

    // Poll the task until it's complete
    let task;
    do {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10 seconds before polling
      console.log("Polling task status");
      task = await client.tasks.retrieve(taskId);
      console.log("Task status:", task.status);
    } while (!['SUCCEEDED', 'FAILED'].includes(task.status));

    if (task.status === 'FAILED') {
      throw new Error(`Video generation failed: ${task.error || "Unknown error"}`);
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
