# Gemini Developer API

[Get a Gemini API Key](https://aistudio.google.com/apikey)

Get a Gemini API key and make your first API request in minutes.  

## Gemini API quickstart

This quickstart shows you how to install our [libraries](https://ai.google.dev/gemini-api/docs/libraries) and make your first Gemini API request.

## Install the Google GenAI SDK

### JavaScript

Using [Node.js v18+](https://nodejs.org/en/download/package-manager),
install the
[Google Gen AI SDK for TypeScript and JavaScript](https://www.npmjs.com/package/@google/genai)
using the following
[npm command](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm):  

    npm install @google/genai

## Make your first request

Here is an example that uses the
[`generateContent`](https://ai.google.dev/api/generate-content#method:-models.generatecontent) method
to send a request to the Gemini API using the Gemini 2.5 Flash model.

If you [set your API key](https://ai.google.dev/gemini-api/docs/api-key#set-api-env-var) as the
environment variable `GEMINI_API_KEY`, it will be picked up automatically by the
client when using the [Gemini API libraries](https://ai.google.dev/gemini-api/docs/libraries).
Otherwise you will need to [pass your API key](https://ai.google.dev/gemini-api/docs/api-key#provide-api-key-explicitly) as
an argument when initializing the client.

Note that all code samples in the Gemini API docs assume that you have set the
environment variable `GEMINI_API_KEY`.  

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    
    // The client gets the API key from the environment variable `GEMINI_API_KEY`.
    const ai = new GoogleGenAI({});
    
    async function main() {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Explain how AI works in a few words",
      });
      console.log(response.text);
    }
    
    await main();



## Text Generation



The Gemini API can generate text output from various inputs, including text,
images, video, and audio, leveraging Gemini models.

Here's a basic example that takes a single text input:  

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    
    const ai = new GoogleGenAI({});
    
    async function main() {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "How does AI work?",
      });
      console.log(response.text);
    }
    
    await main();

## Thinking with Gemini 2.5

2.5 Flash and Pro models have ["thinking"](https://ai.google.dev/gemini-api/docs/thinking) enabled by default to enhance quality, which may take longer to run and increase token usage.

When using 2.5 Flash, you can disable thinking by setting the thinking budget to zero.

For more details, see the [thinking guide](https://ai.google.dev/gemini-api/docs/thinking#set-budget).  

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    
    const ai = new GoogleGenAI({});
    
    async function main() {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "How does AI work?",
        config: {
          thinkingConfig: {
            thinkingBudget: 0, // Disables thinking
          },
        }
      });
      console.log(response.text);
    }
    
    await main();

## System instructions and other configurations

You can guide the behavior of Gemini models with system instructions. To do so,
pass a [`GenerateContentConfig`](https://ai.google.dev/api/generate-content#v1beta.GenerationConfig)
object.  

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    
    const ai = new GoogleGenAI({});
    
    async function main() {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Hello there",
        config: {
          systemInstruction: "You are a cat. Your name is Neko.",
        },
      });
      console.log(response.text);
    }
    
    await main();

The [`GenerateContentConfig`](https://ai.google.dev/api/generate-content#v1beta.GenerationConfig)
object also lets you override default generation parameters, such as
[temperature](https://ai.google.dev/api/generate-content#v1beta.GenerationConfig).  

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    
    const ai = new GoogleGenAI({});
    
    async function main() {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Explain how AI works",
        config: {
          temperature: 0.1,
        },
      });
      console.log(response.text);
    }
    
    await main();

Refer to the [`GenerateContentConfig`](https://ai.google.dev/api/generate-content#v1beta.GenerationConfig)
in our API reference for a complete list of configurable parameters and their
descriptions.

## Multimodal inputs

The Gemini API supports multimodal inputs, allowing you to combine text with
media files. The following example demonstrates providing an image:  

### JavaScript

    import {
      GoogleGenAI,
      createUserContent,
      createPartFromUri,
    } from "@google/genai";
    
    const ai = new GoogleGenAI({});
    
    async function main() {
      const image = await ai.files.upload({
        file: "/path/to/organ.png",
      });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          createUserContent([
            "Tell me about this instrument",
            createPartFromUri(image.uri, image.mimeType),
          ]),
        ],
      });
      console.log(response.text);
    }
    
    await main();

For alternative methods of providing images and more advanced image processing,
see our [image understanding guide](https://ai.google.dev/gemini-api/docs/image-understanding).
The API also supports [document](https://ai.google.dev/gemini-api/docs/document-processing), [video](https://ai.google.dev/gemini-api/docs/video-understanding), and [audio](https://ai.google.dev/gemini-api/docs/audio)
inputs and understanding.

## Streaming responses

By default, the model returns a response only after the entire generation
process is complete.

For more fluid interactions, use streaming to receive [`GenerateContentResponse`](https://ai.google.dev/api/generate-content#v1beta.GenerateContentResponse) instances incrementally
as they're generated.  

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    
    const ai = new GoogleGenAI({});
    
    async function main() {
      const response = await ai.models.generateContentStream({
        model: "gemini-2.5-flash",
        contents: "Explain how AI works",
      });
    
      for await (const chunk of response) {
        console.log(chunk.text);
      }
    }
    
    await main();

## Multi-turn conversations (Chat)

Our SDKs provide functionality to collect multiple rounds of prompts and
responses into a chat, giving you an easy way to keep track of the conversation
history.
**Note:** Chat functionality is only implemented as part of the SDKs. Behind the scenes, it still uses the [`generateContent`](https://ai.google.dev/api/generate-content#method:-models.generatecontent) API. For multi-turn conversations, the full conversation history is sent to the model with each follow-up turn.  

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    
    const ai = new GoogleGenAI({});
    
    async function main() {
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        history: [
          {
            role: "user",
            parts: [{ text: "Hello" }],
          },
          {
            role: "model",
            parts: [{ text: "Great to meet you. What would you like to know?" }],
          },
        ],
      });
    
      const response1 = await chat.sendMessage({
        message: "I have 2 dogs in my house.",
      });
      console.log("Chat response 1:", response1.text);
    
      const response2 = await chat.sendMessage({
        message: "How many paws are in my house?",
      });
      console.log("Chat response 2:", response2.text);
    }
    
    await main();

Streaming can also be used for multi-turn conversations.  

### JavaScript

    import { GoogleGenAI } from "@google/genai";
    
    const ai = new GoogleGenAI({});
    
    async function main() {
      const chat = ai.chats.create({
        model: "gemini-2.5-flash",
        history: [
          {
            role: "user",
            parts: [{ text: "Hello" }],
          },
          {
            role: "model",
            parts: [{ text: "Great to meet you. What would you like to know?" }],
          },
        ],
      });
    
      const stream1 = await chat.sendMessageStream({
        message: "I have 2 dogs in my house.",
      });
      for await (const chunk of stream1) {
        console.log(chunk.text);
        console.log("_".repeat(80));
      }
    
      const stream2 = await chat.sendMessageStream({
        message: "How many paws are in my house?",
      });
      for await (const chunk of stream2) {
        console.log(chunk.text);
        console.log("_".repeat(80));
      }
    }
    
    await main();

## Supported models

All models in the Gemini family support text generation. To learn more
about the models and their capabilities, visit the
[Models](https://ai.google.dev/gemini-api/docs/models) page.

## Best practices

### Prompting tips

For basic text generation, a [zero-shot](https://ai.google.dev/gemini-api/docs/prompting-strategies#few-shot)
prompt often suffices without needing examples, system instructions or specific
formatting.

For more tailored outputs:

- Use [System instructions](https://ai.google.dev/gemini-api/docs/text-generation#system-instructions) to guide the model.
- Provide few example inputs and outputs to guide the model. This is often referred to as [few-shot](https://ai.google.dev/gemini-api/docs/prompting-strategies#few-shot) prompting.

Consult our [prompt engineering guide](https://ai.google.dev/gemini/docs/prompting-strategies) for
more tips.

### Structured output

In some cases, you may need structured output, such as JSON. Refer to our
[structured output](https://ai.google.dev/gemini-api/docs/structured-output) guide to learn how.



