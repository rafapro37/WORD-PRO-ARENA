import { GoogleGenAI, Type } from "@google/genai";

export interface ExtractedPlayerStats {
  posicao: string;
  nome: string;
  nota: number;
  gols: number;
  assistencias: number;
}

export const extractStatsFromImage = async (base64Image: string): Promise<ExtractedPlayerStats[]> => {
  const apiKey = process.env.GEMINI_API_KEY || import.meta.env?.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Chave da API Gemini não configurada.");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Analise a imagem enviada que contém a tela de desempenho individual de uma partida.
    Pode ser um jogo virtual (ex: FC 25, eFootball) ou futebol real.

    Extraia TODOS os jogadores da tabela mostrada na imagem.

    A tabela pode ter as seguintes colunas:
    POS = posição do jogador
    Nome = nome do jogador
    NP / Nota = nota do jogador na partida
    G / Gols = gols marcados
    AST / Assistências = assistências

    Regras:
    1. Leia todas as linhas da tabela.
    2. Extraia os dados exatamente como aparecem.
    3. Converta notas com vírgula para ponto (ex: 8,2 → 8.2).
    4. Gols e assistências devem ser números inteiros.
    5. Não ignore nenhum jogador.
    6. A posição deve ser exatamente como aparece.
    7. Retorne os dados estruturados em JSON.

    Formato de resposta obrigatório:
    {
     "jogadores":[
       {
        "posicao":"",
        "nome":"",
        "nota":0,
        "gols":0,
        "assistencias":0
       }
     ]
    }
  `;

  const imagePart = {
    inlineData: {
      mimeType: "image/png",
      data: base64Image.split(',')[1] || base64Image,
    },
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: { parts: [{ text: prompt }, imagePart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            jogadores: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  posicao: { type: Type.STRING },
                  nome: { type: Type.STRING },
                  nota: { type: Type.NUMBER },
                  gols: { type: Type.NUMBER },
                  assistencias: { type: Type.NUMBER },
                },
                required: ["posicao", "nome", "nota", "gols", "assistencias"],
              },
            },
          },
          required: ["jogadores"],
        },
      },
    });

    const text = response.text;
    if (!text) return [];
    const parsed = JSON.parse(text);
    return parsed.jogadores || [];
  } catch (error) {
    console.error("Erro no OCR:", error);
    throw error;
  }
};
