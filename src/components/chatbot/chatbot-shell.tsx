"use client";

import { Bot, RefreshCw, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { buildChatbotReply, defaultBotMessage } from "@/lib/chatbot";
import { useDiasData } from "@/hooks/use-dias-data";

type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
  time: string;
};

const suggestions = [
  "Who has highest attendance?",
  "How many present today?",
  "Show top 3 students",
  "Who is absent today?",
  "What is this system?"
];

export function ChatbotShell() {
  const pathname = usePathname();
  const { botContext } = useDiasData();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      text: defaultBotMessage,
      time: formatTime()
    }
  ]);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, open]);

  if (!mounted) {
    return null;
  }

  function sendMessage(text: string, fromSuggestion = false) {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      time: formatTime()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setTyping(true);
    if (!fromSuggestion) {
      setShowSuggestions(false);
    }

    window.setTimeout(() => {
      const replyText = buildChatbotReply(text, botContext);
      const botMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "bot",
        text: replyText,
        time: formatTime()
      };
      setMessages((prev) => [...prev, botMessage]);
      setTyping(false);
    }, 700);
  }

  return (
    <div className={`chatbot-shell ${pathname === "/admin/login" ? "chatbot-shell--compact" : ""}`}>
      {open ? (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <div className="chatbot-avatar">
                <Bot size={18} />
              </div>
              <div>
                <strong>DIAS Assistant</strong>
                <span>Online - Ready to help</span>
              </div>
            </div>
            <div className="chatbot-head-actions">
              <button
                type="button"
                className="icon-button"
                onClick={() => {
                  setMessages([
                    {
                      id: "welcome-reset",
                      role: "bot",
                      text: defaultBotMessage,
                      time: formatTime()
                    }
                  ]);
                  setShowSuggestions(true);
                }}
              >
                <RefreshCw size={16} />
              </button>
              <button type="button" className="icon-button" onClick={() => setOpen(false)}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="chatbot-body" ref={bodyRef}>
            {messages.map((message) => (
              <div key={message.id} className={`chat-message chat-message--${message.role}`}>
                <div className="chat-bubble">{message.text}</div>
                <span>{message.time}</span>
              </div>
            ))}

            {typing ? <div className="typing-indicator">DIAS Assistant is typing...</div> : null}

            {showSuggestions ? (
              <div className="suggestions">
                {suggestions.map((suggestion) => (
                  <button
                    type="button"
                    key={suggestion}
                    className="suggestion-chip"
                    onClick={() => sendMessage(suggestion, true)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <form
            className="chatbot-input"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about attendance..."
            />
            <button type="submit" className="icon-button icon-button--filled">
              <Send size={16} />
            </button>
          </form>

          <div className="chatbot-footer">Powered by DIAS AI | Created by Adarsh Team</div>
        </div>
      ) : null}

      <button type="button" className="chatbot-fab" onClick={() => setOpen((prev) => !prev)}>
        <Bot size={22} />
        <span className="chatbot-fab-base" />
      </button>
    </div>
  );
}

function formatTime() {
  return new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}
