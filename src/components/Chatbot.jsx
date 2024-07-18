import { useState, useEffect, useRef } from "react";
import { nanoid } from "nanoid";
import { AiOutlineMessage, AiOutlineClose, AiOutlineSend } from "react-icons/ai";
import "tailwindcss/tailwind.css";

/**
 * Renders a chatbot component that allows users to interact with an AI model.
 *
 * @return {JSX.Element} The chatbot component.
 */
const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [sessionId, setSessionId] = useState(() => {
        const storedSessionId = localStorage.getItem("sessionId");
        return storedSessionId || nanoid();
    });
    const [isThinking, setIsThinking] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!localStorage.getItem("sessionId")) {
            const newSessionId = nanoid();
            setSessionId(newSessionId);
            localStorage.setItem("sessionId", newSessionId);
        }
    }, []);

    /**
     * Toggles the chat window open or closed by updating the `isOpen` state.
     *
     * @return {void} This function does not return anything.
     */
    const toggleChat = () => {
        setIsOpen(!isOpen);
    };

    /**
     * Sends the user's input to the server and updates the chat messages accordingly.
     *
     * @return {Promise<void>} A Promise that resolves when the function completes.
     */
    const handleSend = async () => {
        if (input.trim() !== "") {
            setMessages([...messages, { text: input, sender: "user" }]);
            setInput("");
            setIsThinking(true);

            try {
                const response = await fetch("https://mern-backend-neon.vercel.app/send", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ input, sessionId }),
                });

                const data = await response.json();

                if (response.ok) {
                    setMessages((prevMessages) => [
                        ...prevMessages,
                        { text: formatMessage(data.response), sender: "model" },
                    ]);
                } else {
                    console.error("Error:", data.error);
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setIsThinking(false);
            }
        }
    };

    /**
     * Handles the keydown event and triggers the handleSend function if the key pressed is "Enter".
     *
     * @param {KeyboardEvent} e - The keyboard event object.
     * @return {void} This function does not return anything.
     */
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSend();
        }
    };

    /**
     * Formats a message by replacing Markdown syntax with corresponding HTML tags.
     *
     * @param {string} message - The message to be formatted.
     * @return {string} The formatted message with HTML tags.
     */
    const formatMessage = (message) => {
        return message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\/\/(.*?)\/\//g, '<em>$1</em>')
            .replace(/\n/g, '<br />');
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    return (
        <div className="fixed bottom-5 right-5 flex flex-col items-end">
            <button
                onClick={toggleChat}
                className="bg-lime-500 p-4 rounded-full shadow-lg hover:bg-lime-600 transition duration-300"
            >
                <AiOutlineMessage className="text-white text-2xl" />
            </button>

            <div className={`transition-opacity duration-300 ease-in-out ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                {isOpen && (
                    <div className="mt-3 w-80 h-96 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-transform duration-300 ease-in-out">
                        <div className="flex justify-between items-center bg-lime-500 p-3 text-white">
                            <span>iwopal</span>
                            <button
                                onClick={toggleChat}
                                className="hover:bg-lime-600 p-1 rounded-full transition duration-300"
                            >
                                <AiOutlineClose />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 bg-white dark:bg-gray-800">
                            {messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`mb-2 p-2 rounded ${msg.sender === "user" ? "bg-gray-200 text-black" : "bg-lime-500 text-white"}`}
                                    dangerouslySetInnerHTML={{ __html: msg.text }}
                                />
                            ))}
                            {isThinking && (
                                <div className="mb-2 p-2 rounded bg-gray-200 text-black">
                                    <div className="animate-pulse">Loading... </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="bg-lime-500 p-3 flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="flex-1 p-2 rounded-l outline-none bg-white text-black"
                                placeholder="Type your message"
                            />
                            <button
                                onClick={handleSend}
                                className="bg-lime-600 p-2 rounded-r text-white hover:bg-lime-700 transition duration-300"
                            >
                                <AiOutlineSend />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chatbot;
