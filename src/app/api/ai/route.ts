import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { entries, timeframe } = await req.json();

    // Debug logging
    console.log('Received request:', { timeframe, entriesCount: entries.length });

    // Basic validation
    if (!entries || entries.length === 0) {
      return NextResponse.json(
        { error: 'No entries provided' },
        { status: 400 }
      );
    }

    // Prepare entries for AI prompt
    const entriesText = entries
      .map(entry => `Date: ${entry.date}\nContent: ${entry.content}`)
      .join('\n\n');

    // Debug logging
    console.log('Prepared prompt:', entriesText);
    console.log('API Key exists:', !!process.env.OPENAI_API_KEY);

    // Create AI prompt
    const prompt = `Here are my journal entries from ${timeframe}:\n\n${entriesText}\n\n` +
  `Provide a reflection of what was expressed in ${timeframe === 'yesterday' ? 'the last entry' : 'the past week'}. ` +
  `${timeframe === 'yesterday' ? 
    'Keep it brief and to the point.' : 
    'Since this covers a full week, include main themes, notable moments, and significant shifts in thoughts or feelings, while maintaining a direct style.'} ` +
  `Maximum length is 1000 characters, but use only what's needed. ` +
  `Skip any greetings, praise, or questions. Don't add commentary or suggestions. ` +
  `Simply mirror back the thoughts, feelings, and experiences that were shared.\n\n` +
  `Important:\n` +
  `- Maximum 1000 characters, but no filler\n` +
  `- Start directly with "You've..." or "It seems..." or similar\n` +
  `- Stick strictly to what was written - no assumptions\n` +
  `- Skip any greeting or closing\n` +
  `- No questions or suggestions\n` +
  `- No commentary like "that's great" or "awesome"\n\n` +
  `Example for single entry: "You've expressed worry about your rapid progress in coding abilities."\n` +
  `Example for weekly entries: "Throughout the week, you've written about your growing business success, particularly the Wilson contract that will cover Noah's therapy. Sleep disruption has been a consistent challenge, though Emma's support has helped. You've been reconnecting with old creative passions, finding your drum kit and sketchbooks, and making plans to incorporate art back into your routine."`
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    });

    return NextResponse.json({ 
      summary: completion.choices[0].message.content 
    });
    
  } catch (error) {
    // More detailed error logging
    console.error('AI API error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    return NextResponse.json(
      { error: `Failed to generate summary: ${error.message}` },
      { status: 500 }
    );
  }
}