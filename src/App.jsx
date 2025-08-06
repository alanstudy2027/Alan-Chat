import React, { useState, useEffect, useRef } from "react";
import { supabase } from "./config/supabase";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import Avatar from "@mui/material/Avatar";
import SendIcon from "@mui/icons-material/Send";
import "./App.css";
import avatar from "./3d.avif";

const clientId = "554313071695-88jnv5oetp69fknghnocq7i8dogh28s6.apps.googleusercontent.com";

function App() {
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");

  localStorage.setItem("email", email);
  localStorage.setItem("profile", profile);
  localStorage.setItem("name", name);

  const handleGoogleLoginSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    setEmail(decoded.email);
    setProfile(decoded.picture);
    setName(decoded.name);
  };

  const handleGoogleLoginError = () => {
    console.log("Login Failed");
  };

  return (
    <div
      style={{ background: "rgba(27, 32, 45, 1)", overflowY: "auto" }}
      className="lg:h-screen h-[100dvh] w-screen"
    >
      <div className="h-full w-screen relative">
        <div
          style={{
            background: "rgba(41, 47, 63, 1)",
            borderBottomLeftRadius: 30,
            borderBottomRightRadius: 30,
          }}
          className="text-white p-4 flex gap-3 items-center justify-between shadow-2xl relative z-10"
        >
          <div className="flex gap-3 items-center">
            <Avatar src={profile ?? avatar} />
            <ul
              style={{ listStyle: "none", lineHeight: 0.7 }}
              className="m-0 p-0"
            >
              <li style={{}}>
                <p className="text-2xl font-bold m-0">Chat Messager</p>
              </li>
              <li style={{display: name ? "flex" : "none"}}>
                <span className="text-xs text-gray-500 font-semibold">
                  Username : {name}
                </span>
              </li>
            </ul>
          </div>
        </div>
        <GoogleOAuthProvider clientId={clientId}>
          <div className="p-0 flex flex-col items-center justify-center h-[80vh] w-full relative z-0">
            {email && profile && name ? (
              <ChatBox email={email} />
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
                useOneTap
              />
            )}
          </div>
        </GoogleOAuthProvider>
      </div>
    </div>
  );
}

function ChatBox() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const mess = useRef(null);

  const email = localStorage.getItem("email");
  const name = localStorage.getItem("name");
  const profile = localStorage.getItem("profile");

  const notify = () => {
    if (!("Notification" in window)) return;
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") {
        new Notification("New Message", { body: "You have a new message" });
      }
    });
  };

  // Fetch messages initially
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("id", { ascending: true });

      if (error) console.log("Fetch error:", error.message);
      else setMessages(data);
    };

    fetchMessages();
  }, []);

  // Real-time message updates
  useEffect(() => {
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          notify();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-scroll to the latest message
  useEffect(() => {
    mess.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send a new message
  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const timestamp = new Date();
    const time = timestamp.toLocaleTimeString();
    const date = timestamp.toLocaleDateString();

    const { error } = await supabase.from("messages").insert([
      {
        Content: newMessage,
        Time: time,
        Date: date,
        Email: email,
        Name: name,
        Profile: profile,
      },
    ]);

    if (error) console.log("Send error:", error.message);
    else setNewMessage("");
  };

  return (
    <div className=" p-1 rounded-xl w-[96vw]">
      <div className="p-0 lg:h-[83vh] md:h-[73vh] h-[80vh] overflow-y-auto rounded-xl w-full mt-12 sm:mt-6 md:mt-5">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet</p>
        ) : (
          messages.map((msg, index) => (
            <div
              style={{
                background:
                  email === msg.Email
                    ? "rgb(64, 74, 100)"
                    : "rgba(55, 62, 78, 1)",
                marginLeft: email === msg.Email ? "16%" : "0%",
              }}
              key={index}
              className="mb-4 p-4 rounded-2xl w-5/6"
            >
              <div className="flex justify-between">
                <div className="flex items-start gap-2">
                  <Avatar src={msg.Profile} />
                  <div className="">
                    <ul
                      style={{ listStyle: "none", lineHeight: 0.7 }}
                      className="m-0 p-0"
                    >
                      <li style={{}}>
                        <p className="font-semibold uppercase text-gray-300 text-xs truncate w-[100px] overflow-ellipsis">
                          {msg.Name || "Unknown"}
                        </p>
                      </li>
                      <li>
                        <span className="text-xs text-gray-400 m-0">
                          {msg.Time}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{msg.Date}</span>
              </div>
              <p className="lg:ml-12 text-white mt-4 lg:mt-1">{msg.Content}</p>
            </div>
          ))
        )}
        <div ref={mess} />
      </div>
      <div className="my-4 w-full">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="text-white p-3 flex-1 rounded-2xl"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            style={{
              background: "rgba(61, 67, 84, 1)",
              color: "white",
              outline: "none",
              border: "none",
            }}
          />
          <button
            onClick={sendMessage}
            style={{ background: "rgba(122, 129, 148, 1)" }}
            className="text-white px-4 py-2 rounded-xl flex items-center"
          >
            <SendIcon id="send" />
          </button>
        </div>
        <div className="w-full flex justify-center mt-2">
          <span className="text-xs text-gray-400">Created by Alan</span>
        </div>
      </div>
    </div>
  );
}

export default App;
