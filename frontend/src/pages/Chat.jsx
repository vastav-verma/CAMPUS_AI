import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import Icon from "../components/Icon";
import Markdown from "../components/Markdown";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

import {
    getChats,
    getChat,
    sendMessage,
    deleteChat
} from "../services/chat.service";

const SUGGESTIONS = [
    "What are the rules for minimum attendance?",
    "How do I pay my semester fees?",
    "What are the hostel timings and rules?",
    "How can I apply for a bonafide certificate?"
];

const NO_ANSWER = /could not find relevant information/i;

const timeAgo = (value) => {
    const diff = Date.now() - new Date(value).getTime();
    const mins = Math.floor(diff / 60000);

    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return new Date(value).toLocaleDateString();
};

const Chat = () => {
    const { user, college } = useAuth();
    const toast = useToast();

    const [chats, setChats] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [loadingChat, setLoadingChat] = useState(false);
    const [showList, setShowList] = useState(false);

    const endRef = useRef(null);
    const inputRef = useRef(null);

    const botName = college?.chatbotName || "Campus Assistant";

    const loadChats = useCallback(async () => {
        try {
            const result = await getChats();
            setChats(result.data || []);
        } catch {
            setChats([]);
        }
    }, []);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadChats();
    }, [loadChats]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, sending]);

    const newChat = () => {
        setActiveId(null);
        setMessages([]);
        setShowList(false);
        inputRef.current?.focus();
    };

    const openChat = async (chatId) => {
        setShowList(false);
        setActiveId(chatId);
        setLoadingChat(true);

        try {
            const result = await getChat(chatId);
            setMessages(result.data?.messages || []);
        } catch {
            toast.error("Unable to open this conversation.");
        } finally {
            setLoadingChat(false);
        }
    };

    const removeChat = async (event, chatId) => {
        event.stopPropagation();

        if (!window.confirm("Delete this conversation?")) return;

        try {
            await deleteChat(chatId);
            if (chatId === activeId) newChat();
            await loadChats();
        } catch {
            toast.error("Unable to delete the conversation.");
        }
    };

    const send = async (text) => {
        const question = (text ?? input).trim();

        if (!question || sending) return;

        setInput("");
        if (inputRef.current) inputRef.current.style.height = "auto";

        setMessages((prev) => [...prev, { role: "user", content: question }]);
        setSending(true);

        try {
            const result = await sendMessage({ question, chatId: activeId });
            const data = result.data;

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.answer, sources: data.sources?.length || 0 }
            ]);

            if (!activeId) {
                setActiveId(data.chatId);
                await loadChats();
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    error: true,
                    content: "Sorry, I couldn't get an answer right now. Please try again."
                }
            ]);
        } finally {
            setSending(false);
        }
    };

    const onKeyDown = (event) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            send();
        }
    };

    const autosize = (event) => {
        setInput(event.target.value);
        event.target.style.height = "auto";
        event.target.style.height = `${Math.min(event.target.scrollHeight, 160)}px`;
    };

    const copy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            toast.success("Copied to clipboard.");
        } catch {
            toast.error("Copy failed.");
        }
    };

    return (
        <div className="chat">
            <aside className={`chat-list ${showList ? "open" : ""}`}>
                <button type="button" className="btn btn-primary btn-block" onClick={newChat}>
                    <Icon name="plus" size={16} /> New chat
                </button>

                <div className="chat-items">
                    {chats.length === 0 && (
                        <p className="muted small pad">Your conversations will appear here.</p>
                    )}

                    {chats.map((chat) => (
                        <div
                            key={chat._id}
                            role="button"
                            tabIndex={0}
                            className={`chat-item ${chat._id === activeId ? "active" : ""}`}
                            onClick={() => openChat(chat._id)}
                            onKeyDown={(e) => e.key === "Enter" && openChat(chat._id)}
                        >
                            <span className="chat-item-text">
                                <strong>{chat.title || "New conversation"}</strong>
                                <small>{timeAgo(chat.updatedAt || chat.createdAt)}</small>
                            </span>

                            <button
                                type="button"
                                className="icon-btn"
                                aria-label="Delete conversation"
                                onClick={(e) => removeChat(e, chat._id)}
                            >
                                <Icon name="trash" size={15} />
                            </button>
                        </div>
                    ))}
                </div>
            </aside>

            <section className="chat-main">
                <div className="chat-head">
                    <button type="button" className="icon-btn chat-toggle" onClick={() => setShowList((v) => !v)} aria-label="Conversations">
                        <Icon name="menu" size={18} />
                    </button>

                    <span className="bot-avatar"><Icon name="sparkle" size={16} /></span>

                    <div>
                        <strong>{botName}</strong>
                        <small>Answers from {college?.name || "your college"}'s documents</small>
                    </div>
                </div>

                <div className="chat-scroll">
                    {messages.length === 0 && !loadingChat ? (
                        <div className="chat-empty">
                            <span className="bot-avatar bot-avatar-lg"><Icon name="sparkle" size={26} /></span>
                            <h2>Hi {user?.name?.split(" ")[0]}, I'm {botName}</h2>
                            <p className="muted">{college?.welcomeMessage || "Ask me anything about the college."}</p>

                            <div className="suggestions">
                                {SUGGESTIONS.map((s) => (
                                    <button key={s} type="button" className="suggestion" onClick={() => send(s)}>
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="thread">
                            {loadingChat && <p className="muted pad">Loading conversation...</p>}

                            {messages.map((message, index) => (
                                <div key={index} className={`msg msg-${message.role}`}>
                                    {message.role === "assistant" && (
                                        <span className="bot-avatar"><Icon name="sparkle" size={15} /></span>
                                    )}

                                    <div className="bubble-wrap">
                                        <div className={`bubble ${message.error ? "bubble-error" : ""}`}>
                                            {message.role === "assistant" ? (
                                                <Markdown text={message.content} />
                                            ) : (
                                                <p>{message.content}</p>
                                            )}
                                        </div>

                                        {message.role === "assistant" && !message.error && (
                                            <div className="msg-meta">
                                                {message.sources > 0 && (
                                                    <span className="src-chip">
                                                        <Icon name="file" size={12} /> {message.sources} source passages
                                                    </span>
                                                )}

                                                <button type="button" className="link-btn" onClick={() => copy(message.content)}>
                                                    <Icon name="copy" size={12} /> Copy
                                                </button>

                                                {NO_ANSWER.test(message.content) && user?.role === "student" && (
                                                    <Link className="link-btn" to="/complaints">
                                                        Raise a complaint instead →
                                                    </Link>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {sending && (
                                <div className="msg msg-assistant">
                                    <span className="bot-avatar"><Icon name="sparkle" size={15} /></span>
                                    <div className="bubble typing" aria-label="Assistant is typing">
                                        <i /><i /><i />
                                    </div>
                                </div>
                            )}

                            <div ref={endRef} />
                        </div>
                    )}
                </div>

                <div className="composer">
                    <div className="composer-box">
                        <textarea
                            ref={inputRef}
                            rows={1}
                            value={input}
                            onChange={autosize}
                            onKeyDown={onKeyDown}
                            placeholder={`Message ${botName}...`}
                            maxLength={2000}
                            aria-label="Your question"
                        />

                        <button
                            type="button"
                            className="send-btn"
                            onClick={() => send()}
                            disabled={!input.trim() || sending}
                            aria-label="Send"
                        >
                            <Icon name="send" size={18} />
                        </button>
                    </div>

                    <small className="muted">
                        Enter to send · Shift+Enter for a new line · Answers come only from your college's uploaded documents.
                    </small>
                </div>
            </section>
        </div>
    );
};

export default Chat;
