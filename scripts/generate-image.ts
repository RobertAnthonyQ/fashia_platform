import { GoogleGenAI } from '@google/genai';
import mime from 'mime';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const OUTPUT_DIR = path.join(process.cwd(), 'generated-images');

async function main() {
  const prompt = process.argv.slice(2).join(' ');
  if (!prompt) {
    console.error('Usage: npx tsx scripts/generate-image.ts <prompt>');
    process.exit(1);
  }

  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) {
    console.error('GEMINI_API_KEY not found. Set it in your .env file.');
    process.exit(1);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true });

  const ai = new GoogleGenAI({ apiKey });

  const config = {
    responseModalities: ['IMAGE', 'TEXT'] as const,
  };

  const model = 'gemini-3-pro-image-preview';

  console.log(`Generating image for: "${prompt}"...`);

  const response = await ai.models.generateContent({
    model,
    config,
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
  });

  if (!response.candidates || !response.candidates[0]?.content?.parts) {
    console.error('No response from Gemini');
    process.exit(1);
  }

  let saved = false;
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const ext = mime.getExtension(part.inlineData.mimeType || 'image/png') || 'png';
      const slug = prompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
      const timestamp = Date.now();
      const fileName = `${slug}-${timestamp}.${ext}`;
      const filePath = path.join(OUTPUT_DIR, fileName);

      const buffer = Buffer.from(part.inlineData.data || '', 'base64');
      writeFileSync(filePath, buffer);
      console.log(`Image saved: ${filePath}`);
      saved = true;
    } else if (part.text) {
      console.log(part.text);
    }
  }

  if (!saved) {
    console.error('No image was generated. The model returned only text.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
