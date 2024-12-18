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
    version: "0.1.8",
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

  console.log("Received image data:", image.substring(0, 100) + "...");

  try {
    let promptImage = image;

    if (image.startsWith("http://") || image.startsWith("https://")) {
      console.log("Using image URL:", image);
    } else if (image.startsWith("data:")) {
      console.log("Using Base64 encoded image data");
    } else {
      console.log("Attempting to read local file");
      let absolutePath;
      try {
        absolutePath = path.isAbsolute(image) ? image : path.resolve(process.cwd(), image);
        console.log("Resolved absolute path:", absolutePath);
        const imageBuffer = fs.readFileSync(absolutePath);
        const base64Image = imageBuffer.toString("base64");
        const mimeType = mime.lookup(absolutePath) || 'application/octet-stream';
        promptImage = `data:${mimeType};base64,${base64Image}`;
        console.log("Successfully read and encoded local file");
      } catch (readError: unknown) {
        console.error("Error reading local file:", readError);
        throw new Error(`Failed to read local file: ${readError instanceof Error ? readError.message : String(readError)}`);
      }
    }

    console.log("Creating image-to-video task");
    const imageToVideo = await client.imageToVideo.create({
      model: 'gen3a_turbo',
      promptImage: promptImage,
      promptText: promptText || "",
    });

    const taskId = imageToVideo.id;
    console.log("Task created with ID:", taskId);

    let task;
    do {
      await new Promise(resolve => setTimeout(resolve, 10000));
      console.log("Polling task status");
      task = await client.tasks.retrieve(taskId);
      console.log("Task status:", task.status);
    } while (!['SUCCEEDED', 'FAILED'].includes(task.status));

    if (task.status === 'FAILED') {
      throw new Error(`Video generation failed: Unknown error`);
    }

    if (task.status === 'SUCCEEDED' && task.output && typeof task.output === 'object' && 'videoUrl' in task.output) {
      return {
        content: [
          {
            type: "text",
            text: `Video generated successfully. Output URL: ${task.output.videoUrl}`,
          },
        ],
      };
    } else {
      throw new Error("Video generation succeeded but output is in unexpected format");
    }
  } catch (error) {
    console.error("Error generating video:", error);
    throw new McpError(
      ErrorCode.InternalError,
      "Failed to generate video: " + (error instanceof Error ? error.message : String(error))
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
