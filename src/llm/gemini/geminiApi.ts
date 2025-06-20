import { safeFetch } from '../../utils/safeFetch';
import { LLMProvider } from '../llmManager';
import { geminiPrompt } from './tweetReplyPrompt';

export const GeminiProvider: LLMProvider = {
  id: 'gemini',
  name: 'Gemini',
  async generateReply(prompt, context) {
    const apiKey = context.apiKey;
    const model = context.model || 'gemini-2.0-flash-exp';
    const baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/';
    const url = `${baseUrl}${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    let contents;
    if (prompt) {
      contents = [ { parts: [ { text: prompt } ] } ];
    } else if (Array.isArray(context.thread) && context.thread.length > 1) {
      // スレッド履歴がある場合は会話形式で送る（旧ロジック）
      contents = context.thread.map(item => ({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content }]
      }));
      contents.push({
        role: 'user',
        parts: [{ text: geminiPrompt.replace('{tweet}', context.tweetText) }]
      });
    } else {
      contents = [
        { parts: [{ text: geminiPrompt.replace('{tweet}', context.tweetText) }] }
      ];
    }
    const body = { contents };
    const res = await safeFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'リプライ生成に失敗しました';
    return text;
  }
}; 