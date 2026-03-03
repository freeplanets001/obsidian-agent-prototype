import { NextResponse } from 'next/server';
import { Anthropic } from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const DB_FILE = path.join(process.cwd(), 'data/vector_db.json');

interface VectorRecord {
    id: string;
    text: string;
    category: string;
    embedding: number[];
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Mock embedding generation for queries to match DB mock
async function generateQueryEmbedding(query: string): Promise<number[]> {
    const vector = new Array(1536).fill(0).map(() => Math.random());
    return vector;
}

export async function POST(req: Request) {
    try {
        const { query } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        if (!fs.existsSync(DB_FILE)) {
            return NextResponse.json({ error: 'Database not found. Please run ingest script.' }, { status: 500 });
        }

        const records: VectorRecord[] = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));

        // In a real scenario, this gets a real embedding from Voygage/Anthropic
        const queryEmbedding = await generateQueryEmbedding(query);

        // Calculate similarities
        const scoredRecords = records.map(record => ({
            ...record,
            score: cosineSimilarity(queryEmbedding, record.embedding)
        }));

        // Sort by score (descending) and take top 5
        scoredRecords.sort((a, b) => b.score - a.score);
        const topResults = scoredRecords.slice(0, 5);

        // Filter out the actual raw embeddings from the response to save bandwidth
        const responseResults = topResults.map(({ text, category, score, id }) => ({
            id, text, category, score
        }));

        return NextResponse.json({ results: responseResults });

    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
