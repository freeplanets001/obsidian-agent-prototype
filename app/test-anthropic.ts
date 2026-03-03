import { Anthropic } from '@anthropic-ai/sdk';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: './app/.env.local' });

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

async function main() {
    try {
        const messages = [{ role: 'user', content: 'テスト' }];
        const systemPrompt = "ルール\n- 日本語で回答する";

        const anthropicMessages = messages.map((msg: any) => {
            if (msg.image) {
                // ... image logic omitted for simple text test ...
                return {};
            }
            return {
                role: msg.role === 'assistant' ? 'assistant' : 'user',
                content: msg.content
            };
        });

        console.log("SENDING:", JSON.stringify(anthropicMessages, null, 2));

        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: 1024,
            system: systemPrompt,
            messages: anthropicMessages as any[],
        });

        console.log("RESPONSE SUCCESS:", response.content[0]);
    } catch (e) {
        console.error("API ERROR:", e);
    }
}
main();
