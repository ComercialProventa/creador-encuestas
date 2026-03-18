import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const surveyId = searchParams.get('surveyId');

    if (!surveyId) {
      return new NextResponse('Error: surveyId is required', { status: 400 });
    }

    // 1. Fetch survey and questions
    const { data: surveyData, error: surveyError } = await supabase
      .from('surveys')
      .select('title, questions')
      .eq('id', surveyId)
      .single();

    if (surveyError || !surveyData) {
      return new NextResponse('Error: Survey not found', { status: 404 });
    }

    const title = surveyData.title;
    // Handle either stringified JSON or proper JSONB
    let questions: any[] = [];
    if (typeof surveyData.questions === 'string') {
      try {
        questions = JSON.parse(surveyData.questions);
      } catch (e) {
        questions = [];
      }
    } else if (Array.isArray(surveyData.questions)) {
      questions = surveyData.questions;
    }

    // 2. Fetch responses and answers
    const { data: responsesData, error: responsesError } = await supabase
      .from('responses')
      .select('id, created_at, contact_info, answers(question_id, text_value)')
      .eq('survey_id', surveyId)
      .order('created_at', { ascending: false });

    if (responsesError) {
      return new NextResponse('Error fetching responses', { status: 500 });
    }

    // 3. Build CSV Header
    // Basic columns: ID, Date, Lead Contact
    const headerRow = ['ID Respuesta', 'Fecha', 'Contacto (Lead)'];
    
    // Append a column for each question
    questions.forEach((q) => {
      // Escape quotes in the question title
      const safeTitle = q.title.replace(/"/g, '""');
      headerRow.push(`"${safeTitle}"`);
    });

    let csvContent = headerRow.join(',') + '\n';

    // 4. Build CSV Rows (1 per response)
    const responses = responsesData || [];
    
    responses.forEach((resp) => {
      const row = [];

      // A) ID
      row.push(resp.id);
      
      // B) Date
      const dateStr = new Date(resp.created_at).toLocaleString('es-ES');
      row.push(`"${dateStr}"`);
      
      // C) Contact Info
      const contact = resp.contact_info || '';
      row.push(`"${contact.replace(/"/g, '""')}"`);

      // D) Answers
      // We process answers array for this response
      const answersMap: Record<string, string> = {};
      if (resp.answers && Array.isArray(resp.answers)) {
        resp.answers.forEach((ans: any) => {
          answersMap[ans.question_id] = ans.text_value || '';
        });
      }

      // Add each answer based on the questions order
      questions.forEach((q) => {
        let answerText = answersMap[q.id] || '';
        
        // Clean up arrays from multiple_choice if stored as JSON array string
        try {
          if (answerText.startsWith('[') && answerText.endsWith(']')) {
            const parsed = JSON.parse(answerText);
            if (Array.isArray(parsed)) {
              answerText = parsed.join(', ');
            }
          }
        } catch (e) {
          // ignore parsing error, treat as raw text
        }

        // Escape quotes and wrap in quotes to prevent comma breaking
        row.push(`"${answerText.replace(/"/g, '""')}"`);
      });

      // Join row and append to CSV
      csvContent += row.join(',') + '\n';
    });

    // 5. Return the file as response
    // Ensure filename is safe
    const safeFilename = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="encuesta_${safeFilename}.csv"`,
      },
    });

  } catch (err: any) {
    return new NextResponse(`Server error: ${err.message}`, { status: 500 });
  }
}
