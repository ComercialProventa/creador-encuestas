import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ── System prompt for the LLM ──────────────────────────────
const SYSTEM_PROMPT = `Eres un experto en diseño de encuestas para comercios locales.
El usuario te dará un tema o contexto. Tu trabajo es devolver ÚNICAMENTE un arreglo JSON válido con preguntas de encuesta.

REGLAS ESTRICTAS:
1. Devuelve SOLO el arreglo JSON, sin markdown, sin backticks, sin texto adicional.
2. En caso de que el usuario no entregue una lista de sus preguntas, genera entre 5 y 8 preguntas variadas.
3. Cada pregunta debe respetar esta interfaz TypeScript:
   { id: string, title: string, type: "rating_stars" | "nps" | "single_choice" | "multiple_choice" | "text_open" | "likert", options?: string[], isRequired: boolean }
4. Para "single_choice" y "multiple_choice", incluye un arreglo "options" con 3-5 opciones relevantes.
5. Para los demás tipos, NO incluyas "options".
6. El campo "id" debe ser un string único (usa formato "q-1", "q-2", etc.).
7. Incluye al menos una pregunta de cada tipo: rating_stars, nps, likert, y al menos una de opción.
8. Marca como isRequired: true las preguntas más importantes (al menos 3).
9. Las preguntas deben ser en español, profesionales y relevantes al contexto dado.
10. La última pregunta debe ser de tipo "text_open" para comentarios abiertos.`;



export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
      return NextResponse.json(
        { error: 'Proporciona un prompt descriptivo (mínimo 5 caracteres).' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Falta la variable GEMINI_API_KEY en .env.local' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: SYSTEM_PROMPT },
            { text: `\nContexto del usuario: "${prompt.trim()}"` },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    });

    const text = result.response.text().trim();

    // Parse and validate
    let questions: unknown[];
    try {
      const parsed = JSON.parse(text);
      questions = Array.isArray(parsed) ? parsed : [];
    } catch {
      // Try to extract JSON array from text
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        questions = JSON.parse(match[0]);
      } else {
        return NextResponse.json(
          { error: 'La IA no devolvió un JSON válido. Intenta de nuevo.' },
          { status: 422 }
        );
      }
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { error: 'No se generaron preguntas. Intenta con un prompt más descriptivo.' },
        { status: 422 }
      );
    }

    // Validate each question has required fields
    const validTypes = ['rating_stars', 'nps', 'single_choice', 'multiple_choice', 'text_open', 'likert'];
    const validated = questions.filter((q: unknown) => {
      if (!q || typeof q !== 'object') return false;
      const obj = q as Record<string, unknown>;
      return (
        typeof obj.id === 'string' &&
        typeof obj.title === 'string' &&
        typeof obj.type === 'string' &&
        validTypes.includes(obj.type)
      );
    });

    if (validated.length === 0) {
      return NextResponse.json(
        { error: 'El formato de las preguntas generadas no es válido.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ questions: validated });
  } catch (err) {
    console.error('AI generation error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al generar la encuesta.' },
      { status: 500 }
    );
  }
}
