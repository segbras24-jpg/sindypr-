import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

// Initialize client safely only when needed to avoid startup errors if key is missing locally
const getAiClient = () => {
  if (!apiKey) {
    console.warn("API_KEY is missing. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const draftNoticeContent = async (topic: string, tone: string): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Erro: Chave de API não configurada.";

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Escreva um comunicado de condomínio curto, profissional e claro sobre o seguinte tópico: "${topic}". O tom deve ser: ${tone}. Retorne apenas o texto do corpo do comunicado, sem cabeçalhos markdown.`;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Não foi possível gerar o texto.";
  } catch (error) {
    console.error("Error generating notice:", error);
    return "Erro ao conectar com a IA. Tente novamente.";
  }
};
