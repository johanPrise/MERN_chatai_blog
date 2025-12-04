import { Client } from '@gradio/client';
import { IMessage } from '../types/conversation.types.js';

// Interface pour la session de chat
interface ChatSession {
  messages: IMessage[];
  lastUpdated: Date;
}

// Map pour stocker les sessions de chat
const chatSessions = new Map<string, ChatSession>();

// Durée de vie d'une session en millisecondes (24 heures)
const SESSION_TTL = 24 * 60 * 60 * 1000;

/**
 * Nettoie les sessions expirées
 */
const cleanupSessions = () => {
  const now = new Date();
  for (const [sessionId, session] of chatSessions.entries()) {
    if (now.getTime() - session.lastUpdated.getTime() > SESSION_TTL) {
      chatSessions.delete(sessionId);
    }
  }
};

// Nettoyer les sessions toutes les heures
setInterval(cleanupSessions, 60 * 60 * 1000);

/**
 * Récupère ou crée une session de chat
 */
const getOrCreateSession = (sessionId: string): ChatSession => {
  if (!chatSessions.has(sessionId)) {
    chatSessions.set(sessionId, {
      messages: [],
      lastUpdated: new Date(),
    });
  }

  const session = chatSessions.get(sessionId)!;
  session.lastUpdated = new Date();
  return session;
};

/**
 * Génère une réponse à partir du modèle d'IA
 */
const generateResponse = async (messages: IMessage[]): Promise<string> => {
  const models = [
    'Qwen/Qwen2-72B-Instruct',
    'Qwen/Qwen1.5-110B-Chat-demo',
    'Qwen/Qwen3-Demo', // Nouveau modèle en fallback
  ];

  for (const model of models) {
    try {
      const client = await Client.connect(model);

      // Récupérer le dernier message de l'utilisateur
      const lastUserMessage = messages[messages.length - 1].content;

      let result;

      // Qwen3-Demo utilise un endpoint différent
      if (model === 'Qwen/Qwen3-Demo') {
        console.log(`🔄 Utilisation du modèle Qwen3 avec endpoint /add_message`);

        result = await client.predict('/add_message', {
          input_value: lastUserMessage,
          settings_form_value: {
            model: 'qwen3-235b-a22b',
            sys_prompt:
              process.env.QWEN_PROMPT ||
              "Tu es un assistant utile et amical pour un blog sur la technologie et l'IA.",
            thinking_budget: 38,
          },
        });
      } else {
        // Anciens modèles utilisent /model_chat
        const history = messages.slice(0, -1).map(msg => [msg.content, msg.sender]);

        result = await client.predict('/model_chat', {
          query: lastUserMessage,
          history: history,
          system:
            process.env.QWEN_PROMPT ||
            "Tu es un assistant utile et amical pour un blog sur la technologie et l'IA.",
        });
      }

      console.log(`Résultat brut de l'API (${model}):`, result.data);

      if (!result || !result.data) {
        throw new Error("Format de réponse invalide de l'API");
      }

      // Extraire la réponse du modèle
      const resultData = result.data as any;

      let aiResponse: string;

      if (model === 'Qwen/Qwen3-Demo') {
        // Format de réponse Qwen3: resultData est un tableau, l'élément avec la clé 'value' contient le chatbot
        // Chercher l'objet qui contient value avec les messages
        const chatbotData = resultData.find(
          (item: any) => item && item.value && Array.isArray(item.value)
        );

        if (chatbotData && chatbotData.value && chatbotData.value.length > 0) {
          // value contient un tableau de [user_message, bot_message]
          const lastExchange = chatbotData.value[chatbotData.value.length - 1];

          // Vérifier que lastExchange est bien un objet avec les bonnes propriétés
          if (lastExchange && typeof lastExchange === 'object') {
            let rawResponse: any;

            // Le format peut être un tableau [user, bot] ou un objet {role, content}
            if (Array.isArray(lastExchange) && lastExchange.length >= 2) {
              rawResponse = lastExchange[1]; // [user_msg, assistant_msg]
            } else if (lastExchange.content) {
              rawResponse = lastExchange.content;
            } else {
              throw new Error('Format de réponse Qwen3 invalide: structure de message inattendue');
            }

            // Extraire la chaîne de caractères du format Qwen3
            if (typeof rawResponse === 'string') {
              aiResponse = rawResponse;
            } else if (Array.isArray(rawResponse)) {
              // Nouveau format Qwen3: [{type:"tool", content:"..."}, {type:"text", content:"..."}]
              const textObject = rawResponse.find((item: any) => item && item.type === 'text');
              if (textObject && textObject.content) {
                aiResponse = textObject.content;
              } else {
                // Fallback: prendre le contenu du dernier élément
                const lastItem = rawResponse[rawResponse.length - 1];
                aiResponse = lastItem?.content || JSON.stringify(rawResponse);
              }
            } else if (rawResponse && typeof rawResponse === 'object') {
              // Format objet simple
              aiResponse =
                rawResponse.content ||
                rawResponse.text ||
                rawResponse.message ||
                JSON.stringify(rawResponse);
            } else {
              aiResponse = String(rawResponse);
            }
          } else {
            throw new Error('Format de réponse Qwen3 invalide: lastExchange invalide');
          }
        } else {
          console.error(
            'Structure complète de la réponse Qwen3:',
            JSON.stringify(resultData, null, 2)
          );
          throw new Error('Format de réponse Qwen3 invalide: chatbotData introuvable');
        }
      } else {
        // Format de réponse ancien modèle
        aiResponse = resultData[1][resultData[1].length - 1][1];
      }

      return aiResponse;
    } catch (error) {
      console.error(`Erreur lors de la génération de la réponse avec ${model}:`, error);

      // Si c'est le dernier modèle de la liste, relancer l'erreur
      if (model === models[models.length - 1]) {
        throw error;
      }

      // Sinon, continuer avec le modèle suivant
      console.log(`Essai avec le modèle suivant...`);
    }
  }

  // Si aucun modèle n'a réussi à générer une réponse
  throw new Error('Tous les modèles ont échoué à générer une réponse');
};

/**
 * Envoie un message à l'IA et récupère la réponse
 */
export const sendMessage = async (input: string, sessionId: string): Promise<string> => {
  try {
    // Récupérer la session
    const session = getOrCreateSession(sessionId);

    // Ajouter le message de l'utilisateur à l'historique
    session.messages.push({ content: input, sender: 'user' });

    // Limiter l'historique à 10 messages pour éviter de dépasser les limites de l'API
    if (session.messages.length > 10) {
      session.messages = session.messages.slice(-10);
    }

    // Générer une réponse
    const aiResponse = await generateResponse(session.messages);

    // Ajouter la réponse de l'IA à l'historique
    session.messages.push({ content: aiResponse, sender: 'assistant' });

    return aiResponse;
  } catch (error) {
    console.error("Erreur lors de l'envoi du message à l'IA:", error);

    // En cas d'erreur, utiliser une réponse de secours
    return 'Désolé, je rencontre des difficultés à traiter votre demande pour le moment. Veuillez réessayer plus tard.';
  }
};
