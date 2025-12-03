"use client"

import React, { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Upload from "../../components/upload";

export default function Chat(){
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, error, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ragchat",
    }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) =>{
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  }

  return (
    <div className="w-screen min-h-screen flex p-2 flex-col items-center bg-gray-700">
      {error && <div className="text-red-400 mb-4">{error.message}</div>}

      <div className="w-full max-w-3xl mt-6 pb-32">
        {messages.map((message) => (
          // Use auto margins to push user messages to the right and AI messages to the left
          <div
            key={message.id}
            className={`m-4 rounded-2xl w-fit px-5 py-3 max-w-[70%] whitespace-pre-wrap 
              ${message.role === "user" ? "ml-auto  bg-white text-black" : "mr-auto bg-white text-black"}`}
          >
            <div className={`text-sm font-semibold mb-1 ${message.role === "user" ? "text-blue-100 text-right" : "text-gray-600 text-left"}`}>
             
            </div>

            {message.parts.map((part, index) => {
              if (part.type === "text") return (
                <div key={`${message.id}-${index}`} className="text-base leading-relaxed">
                  {part.text}
                </div>
              );
              return null;
            })}
          </div>
        ))}
      </div>

     

      <form onSubmit={handleSubmit} className="flex gap-4 fixed bottom-6 left-0 right-0 justify-center">
        <div className="relative flex items-center max-w-3xl w-full px-4">
          <input
            className="flex-1 bg-gray-500 rounded-full p-3 text-white outline-none placeholder-gray-200"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <div className="fixed right-80 bottom-8 ">
            <Upload />
          </div>
        </div>

        {status === "submitted" || status === "streaming" ? (
          <button
            className="bg-red-500 text-white rounded-full px-4 py-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={(e) => { e.preventDefault(); stop(); }}
          >
            Stop
          </button>
        ) : (
          <button
            className="bg-blue-500 text-white rounded-full px-4 py-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={status !== "ready"}
          >
            Send
          </button>
        )}
      </form>
    </div>
  );
}
