import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';

// Initialize the Anthropic client
// Ensure ANTHROPIC_API_KEY is in your .env.local
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(req: Request) {
    try {
        const { messages, context } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Valid messages array is required' }, { status: 400 });
        }

        // Build the system prompt using the retrieved context
        const systemPrompt = `あなたはObsidianの専門家エージェントです。
以下のナレッジを参考に、質問に正確・簡潔に回答してください。

【参考ナレッジ】
${context || '特に提供されたナレッジはありません。'}

【ルール】
- 日本語で回答する
- ナレッジに情報がない場合は「確認が必要です」と正直に伝える
- 手順はステップ形式で分かりやすく説明する
- プラグイン名・設定名は正確に記載する`;

        // Call the Anthropic API
        const response = await anthropic.messages.create({
            model: 'claude-3-haiku-20240307', // Fallback to Claude 3 Haiku
            max_tokens: 1024,
            system: systemPrompt,
            messages: messages,
        });

        // Check if the response contains text blocks
        const contentBlock = response.content[0];
        const textCode = contentBlock.type === 'text' ? contentBlock.text : '';

        return NextResponse.json({ reply: textCode });

    } catch (error: any) {
        console.error('Chat API error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
