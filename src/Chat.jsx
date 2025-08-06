import React, { useState, useEffect } from "react";
import { supabase } from "./config/supabase";

const Chat = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [trigger, setTrigger] = useState(false);
  
    // Fetch Messages & Listen for Realtime Updates
    useEffect(() => {
      const fetchMessages = async () => {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .order("created_at", { ascending: true });
  
        if (error) {
          console.error("Error fetching messages:", error.message);
        } else {
          setMessages(data);
        }
      };
  
      fetchMessages();
  
      // Real-time message listener
      const subscription = supabase
        .channel("realtime messages")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
          }
        )
        .subscribe((status) => console.log("Subscription status:", status));
  
      return () => {
        supabase.removeChannel(subscription);
      };
    }, [trigger]);
  
    // Send Message
    const sendMessage = async () => {
      if (!newMessage.trim()) return;
  
      const { error } = await supabase.from("messages").insert([
        {
          content: newMessage,
        },
      ]);
  
      if (error) {
        console.error("Error sending message:", error.message);
      } else {
        setNewMessage(""); // Clear input after sending
      }
      setTrigger(!trigger); // Re-fetch messages
    };
  
    return (
      <div className="p-4 max-w-lg mx-auto">
        <div className="border p-4 h-80 overflow-y-auto bg-gray-100 rounded">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center">No messages yet</p>
          ) : (
            messages.map((msg) => (
              <p key={msg.id} className="border-b p-2 bg-white rounded shadow mb-4">
                {msg.content}
              </p>
            ))
          )}
        </div>
  
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="border p-2 flex-1 rounded"
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </div>
      </div>
    );
  };

export default Chat;
