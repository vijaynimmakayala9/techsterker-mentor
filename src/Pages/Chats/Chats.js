import React, { useState, useRef, useEffect } from "react";
import {
    Send,
    Users,
    User,
    Menu,
    X,
    Search,
    Paperclip,
    Download,
    Eye,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

const BASE_URL = "https://api.techsterker.com";

const MentorChats = () => {
    const [activeChat, setActiveChat] = useState(null);
    const [message, setMessage] = useState("");
    const [showList, setShowList] = useState(true);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isMobile, setIsMobile] = useState(false);
    const [files, setFiles] = useState([]);
    const [loadingChats, setLoadingChats] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [groups, setGroups] = useState([]);
    const [individuals, setIndividuals] = useState([]);
    const [chatMessages, setChatMessages] = useState({});
    const [error, setError] = useState(null);
    const [previewModal, setPreviewModal] = useState({ open: false, file: null });
    const [showAllGroups, setShowAllGroups] = useState(false);
    const [showAllIndividuals, setShowAllIndividuals] = useState(false);
    const [currentGroupMembers, setCurrentGroupMembers] = useState([]);
    const [refreshInterval, setRefreshInterval] = useState(null);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    const mentorId = localStorage.getItem("mentorId");
    console.log("Mentor ID:", mentorId);

    // Responsive layout
    useEffect(() => {
        const checkScreen = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (!mobile) setShowList(true);
        };
        checkScreen();
        window.addEventListener("resize", checkScreen);
        return () => window.removeEventListener("resize", checkScreen);
    }, []);

    // Fetch both group and individual chats
    useEffect(() => {
        if (!mentorId) return;

        const fetchChats = async () => {
            try {
                setLoadingChats(true);
                setError(null);
                
                // Fetch group chats
                const groupRes = await fetch(`${BASE_URL}/api/group-chats/${mentorId}`);
                const groupData = await groupRes.json();
                console.log("Fetched group chats:", groupData);

                // Fetch individual chats
                const individualRes = await fetch(`${BASE_URL}/api/individual-chats/${mentorId}`);
                const individualData = await individualRes.json();
                console.log("Fetched individual chats:", individualData);

                if (groupData.success && Array.isArray(groupData.data)) {
                    const groupChats = groupData.data.map((g) => ({
                        id: g._id,
                        name: g.groupName,
                        type: "group",
                        lastMessage: g.lastMessage?.text || "",
                        members: [...(g.enrolledUsers || []), ...(g.mentors || [])],
                        raw: g,
                    }));
                    setGroups(groupChats);
                } else {
                    throw new Error(groupData.message || "Failed to load group chats");
                }

                if (individualData.success && Array.isArray(individualData.data)) {
                    const individualChats = individualData.data.map((chat) => ({
                        id: chat._id,
                        name: chat.otherUser?.name || chat.groupName,
                        type: "individual",
                        lastMessage: chat.lastMessage?.text || "",
                        otherUser: chat.otherUser,
                        status: "online",
                        raw: chat,
                    }));
                    setIndividuals(individualChats);
                } else {
                    console.warn("No individual chats found or failed to load");
                }

            } catch (err) {
                console.error("Error fetching chats:", err);
                setError("Failed to load chats. Please try again.");
            } finally {
                setLoadingChats(false);
            }
        };

        fetchChats();
    }, [mentorId]);

    // Auto-refresh messages for active chat
    useEffect(() => {
        if (!activeChat || !mentorId) {
            // Clear interval if no active chat
            if (refreshInterval) {
                clearInterval(refreshInterval);
                setRefreshInterval(null);
            }
            return;
        }

        // Function to fetch messages
        const fetchMessages = async () => {
            try {
                let url;
                if (activeChat.type === "group") {
                    url = `${BASE_URL}/api/group-messages/${activeChat.id}/${mentorId}`;
                } else {
                    // For individual chats, we need both user ID and mentor ID
                    const otherUserId = activeChat.otherUser?._id;
                    url = `${BASE_URL}/api/individual-messages/${otherUserId}/${mentorId}`;
                }

                const res = await fetch(url);
                const data = await res.json();
                console.log("Auto-refresh messages response:", data);

                let messagesArray = [];

                if (data.success) {
                    // Handle different response structures
                    if (Array.isArray(data.messages)) {
                        messagesArray = data.messages;
                    } else if (Array.isArray(data.data)) {
                        messagesArray = data.data;
                    } else if (Array.isArray(data)) {
                        messagesArray = data;
                    } else {
                        console.log("No messages found, using empty array");
                        messagesArray = [];
                    }
                } else {
                    console.error("Failed to auto-refresh messages:", data.message);
                    return;
                }

                const formattedMessages = messagesArray.map((msg) => {
                    const senderName = msg.sender?.name || "Unknown";
                    const isYou = msg.sender?._id === mentorId;
                    const timestamp = new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                    });

                    let mediaFiles = [];
                    if (Array.isArray(msg.media) && msg.media.length > 0) {
                        mediaFiles = msg.media.map((m) => {
                            const url = m.url;
                            const fileName = m.fileName || url.split('/').pop() || 'file';
                            const lowerName = fileName.toLowerCase();
                            const isImageType =
                                m.type?.startsWith('image/') ||
                                /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(lowerName);

                            return {
                                url,
                                fileName,
                                type: isImageType ? "image" : "file",
                            };
                        });
                    }

                    return {
                        sender: isYou ? "You" : senderName,
                        text: msg.text || "",
                        timestamp,
                        files: mediaFiles,
                        isYou: isYou, // Add this flag for easier alignment
                    };
                });

                // Only update if messages have changed
                setChatMessages((prev) => {
                    const currentMessages = prev[activeChat.id] || [];
                    if (JSON.stringify(currentMessages) !== JSON.stringify(formattedMessages)) {
                        return {
                            ...prev,
                            [activeChat.id]: formattedMessages,
                        };
                    }
                    return prev;
                });

            } catch (err) {
                console.error("Error auto-refreshing messages:", err);
                // Don't show error to user for auto-refresh failures
            }
        };

        // Clear any existing interval
        if (refreshInterval) {
            clearInterval(refreshInterval);
        }

        // Fetch immediately and then set up interval
        fetchMessages();
        const interval = setInterval(fetchMessages, 2000);
        setRefreshInterval(interval);

        // Cleanup on unmount or when dependencies change
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [activeChat, mentorId]); // Re-run when activeChat or mentorId changes

    // Also add cleanup when component unmounts
    useEffect(() => {
        return () => {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages, activeChat]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleChatSelect = async (chat) => {
        // Clear existing interval when switching chats
        if (refreshInterval) {
            clearInterval(refreshInterval);
            setRefreshInterval(null);
        }

        setLoadingMessages(true);
        setError(null);
        try {
            let url;
            if (chat.type === "group") {
                url = `${BASE_URL}/api/group-messages/${chat.id}/${mentorId}`;
            } else {
                // For individual chats, we need both user ID and mentor ID
                const otherUserId = chat.otherUser?._id;
                url = `${BASE_URL}/api/individual-messages/${otherUserId}/${mentorId}`;
            }

            const res = await fetch(url);
            const data = await res.json();
            console.log("Fetched messages response:", data);

            let messagesArray = [];

            if (data.success) {
                // Handle different response structures
                if (Array.isArray(data.messages)) {
                    messagesArray = data.messages;
                } else if (Array.isArray(data.data)) {
                    messagesArray = data.data;
                } else if (Array.isArray(data)) {
                    messagesArray = data;
                } else {
                    console.log("No messages found, using empty array");
                    messagesArray = [];
                }
            } else {
                throw new Error(data.message || "Failed to load messages");
            }

            const formattedMessages = messagesArray.map((msg) => {
                const senderName = msg.sender?.name || "Unknown";
                const isYou = msg.sender?._id === mentorId;
                const timestamp = new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                });

                let mediaFiles = [];
                if (Array.isArray(msg.media) && msg.media.length > 0) {
                    mediaFiles = msg.media.map((m) => {
                        const url = m.url;
                        const fileName = m.fileName || url.split('/').pop() || 'file';
                        const lowerName = fileName.toLowerCase();
                        const isImageType =
                            m.type?.startsWith('image/') ||
                            /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(lowerName);

                        return {
                            url,
                            fileName,
                            type: isImageType ? "image" : "file",
                        };
                    });
                }

                return {
                    sender: isYou ? "You" : senderName,
                    text: msg.text || "",
                    timestamp,
                    files: mediaFiles,
                    isYou: isYou, // Add this flag for easier alignment
                };
            });

            setChatMessages((prev) => ({
                ...prev,
                [chat.id]: formattedMessages,
            }));
            setActiveChat(chat);

        } catch (err) {
            console.error("Error fetching messages:", err);
            setError("Failed to load messages. Please try again.");
        } finally {
            setLoadingMessages(false);
            if (isMobile) setShowList(false);
        }
    };

    // Function to start a new individual chat with a student
    const startIndividualChat = async (student) => {
        try {
            // Create a new individual chat with the student
            const response = await fetch(`${BASE_URL}/api/individual-chats`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId: student._id,
                    mentorId: mentorId,
                }),
            });

            const result = await response.json();

            if (result.success) {
                // Add to individuals list if not already present
                const existingChat = individuals.find(chat => chat.otherUser?._id === student._id);
                
                if (!existingChat) {
                    const newChat = {
                        id: result.data._id,
                        name: student.name,
                        type: "individual",
                        lastMessage: "",
                        otherUser: student,
                        status: "online",
                        raw: result.data,
                    };
                    
                    setIndividuals(prev => [newChat, ...prev]);
                }
                
                // Select the new chat
                handleChatSelect({
                    id: result.data._id,
                    name: student.name,
                    type: "individual",
                    lastMessage: "",
                    otherUser: student,
                    status: "online",
                    raw: result.data,
                });
                
                // Close the modal
                setShowMembersModal(false);
                setSearchTerm("");
            } else {
                throw new Error(result.message || "Failed to start chat");
            }
        } catch (err) {
            console.error("Error starting individual chat:", err);
            setError("Failed to start chat with student. Please try again.");
        }
    };

    // Function to fetch group members when opening members modal
    const fetchGroupMembers = async (groupId) => {
        try {
            const res = await fetch(`${BASE_URL}/api/group-messages/${groupId}/${mentorId}`);
            const data = await res.json();
            
            if (data.success && data.groupDetails) {
                const enrolledUsers = data.groupDetails.enrolledUsers || [];
                const mentors = data.groupDetails.mentors || [];
                
                // Combine students and mentors
                const allMembers = [
                    ...enrolledUsers.map(user => ({ ...user, role: "Student" })),
                    ...mentors.map(user => ({ ...user, role: "Mentor" }))
                ];
                
                setCurrentGroupMembers(allMembers);
            } else {
                console.error("Failed to fetch group members:", data.message);
                setCurrentGroupMembers([]);
            }
        } catch (err) {
            console.error("Error fetching group members:", err);
            setCurrentGroupMembers([]);
        }
    };

    // Send message function
    const sendMessage = async () => {
        if (!message.trim() && files.length === 0) return;
        if (!activeChat || !mentorId) return;

        let url, formData;

        if (activeChat.type === "group") {
            // Group message
            url = `${BASE_URL}/api/group-messages`;
            formData = new FormData();
            formData.append("chatGroupId", activeChat.id);
            formData.append("senderId", mentorId);
            if (message.trim()) formData.append("text", message.trim());
        } else {
            // Individual message
            url = `${BASE_URL}/api/individual-messages`;
            formData = new FormData();
            formData.append("userId", activeChat.otherUser?._id);
            formData.append("mentorId", mentorId);
            formData.append("senderId", mentorId);
            if (message.trim()) formData.append("text", message.trim());
        }

        // Add files
        files.forEach((file) => {
            formData.append("files", file);
        });

        try {
            const res = await fetch(url, {
                method: "POST",
                body: formData,
            });
            const result = await res.json();
            console.log("Send message response:", result);

            if (result.success) {
                const now = new Date();
                const newMsg = {
                    sender: "You",
                    text: message.trim(),
                    timestamp: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                    files: files.map((file) => {
                        const lowerName = file.name.toLowerCase();
                        const isImage = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(lowerName);
                        return {
                            url: URL.createObjectURL(file),
                            fileName: file.name,
                            type: isImage ? "image" : "file",
                        };
                    }),
                    isYou: true, // Add this flag for alignment
                };

                setChatMessages((prev) => ({
                    ...prev,
                    [activeChat.id]: [...(prev[activeChat.id] || []), newMsg],
                }));

                setMessage("");
                setFiles([]);
                if (fileInputRef.current) fileInputRef.current.value = "";
            } else {
                throw new Error(result.message || "Failed to send message");
            }
        } catch (err) {
            console.error("Error sending message:", err);
            setError("Failed to send message. Please try again.");
        }
    };

    const onKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleAttachClick = () => fileInputRef.current?.click();
    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files || []);
        setFiles(selectedFiles);
    };

    const removeFile = (indexToRemove) => {
        setFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
    };

    const openPreview = (file) => {
        setPreviewModal({ open: true, file });
    };

    const closePreview = () => {
        setPreviewModal({ open: false, file: null });
    };

    const getStatusColor = (status) =>
        status === "online" ? "bg-green-500" : status === "away" ? "bg-yellow-500" : "bg-gray-400";

    const renderGroupList = () => {
        if (loadingChats) return <div className="px-3 py-2 text-gray-500">Loading...</div>;
        if (error) return <div className="px-3 py-2 text-red-500">{error}</div>;
        
        const groupsToShow = showAllGroups ? groups : groups.slice(0, 4);
        
        return (
            <>
                {groupsToShow.map((c) => {
                    const active = activeChat?.id === c.id;
                    return (
                        <li
                            key={c.id}
                            onClick={() => handleChatSelect(c)}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer
                                ${active ? "bg-[#a51d34] text-white" : "hover:bg-red-50"}`}
                        >
                            <Users className={`w-4 h-4 ${active ? "text-white" : "text-[#a51d34]"}`} />
                            <span className="truncate">{c.name}</span>
                        </li>
                    );
                })}
                {groups.length > 4 && (
                    <button
                        onClick={() => setShowAllGroups(!showAllGroups)}
                        className="flex items-center gap-2 px-2 py-1.5 text-[#a51d34] hover:bg-red-50 rounded w-full text-left"
                    >
                        {showAllGroups ? (
                            <>
                                <ChevronUp className="w-4 h-4" />
                                <span>Show Less</span>
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-4 h-4" />
                                <span>View All ({groups.length})</span>
                            </>
                        )}
                    </button>
                )}
            </>
        );
    };

    const renderIndividualList = () => {
        const individualsToShow = showAllIndividuals ? individuals : individuals.slice(0, 4);
        
        return (
            <>
                {individualsToShow.map((p) => {
                    const active = activeChat?.id === p.id;
                    return (
                        <li
                            key={p.id}
                            onClick={() => handleChatSelect(p)}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer
                                ${active ? "bg-[#a51d34] text-white" : "hover:bg-red-50"}`}
                        >
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold
                                    ${active ? "bg-white/20 text-white" : "bg-[#a51d34]/10 text-[#a51d34]"}`}
                            >
                                {p.name.charAt(0)}
                            </div>
                            <span className="truncate">{p.name}</span>
                            <span className={`ml-auto w-2 h-2 rounded-full ${getStatusColor("online")}`} />
                        </li>
                    );
                })}
                {individuals.length > 4 && (
                    <button
                        onClick={() => setShowAllIndividuals(!showAllIndividuals)}
                        className="flex items-center gap-2 px-2 py-1.5 text-[#a51d34] hover:bg-red-50 rounded w-full text-left"
                    >
                        {showAllIndividuals ? (
                            <>
                                <ChevronUp className="w-4 h-4" />
                                <span>Show Less</span>
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-4 h-4" />
                                <span>View All ({individuals.length})</span>
                            </>
                        )}
                    </button>
                )}
            </>
        );
    };

    return (
        <div className="h-screen flex bg-white text-[13px]">
            {showList && activeChat && isMobile && (
                <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setShowList(false)} />
            )}

            <aside
                className={`fixed md:static z-40 top-0 left-0 h-full w-72 border-r bg-white transition-transform duration-200 flex flex-col
                    ${showList ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
            >
                <div className="h-14 px-3 flex items-center justify-between border-b bg-[#a51d34] text-white flex-shrink-0">
                    <span className="font-semibold truncate">Workspace</span>
                    <button className="md:hidden p-1 rounded hover:bg-white/20" onClick={() => setShowList(false)}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-3 border-b flex-shrink-0">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            placeholder="Search"
                            className="w-full pl-7 pr-3 py-1.5 border rounded text-[13px] focus:ring-1 focus:ring-[#a51d34]"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="px-3 pt-3">
                        <div className="text-gray-500 uppercase text-[11px] font-semibold mb-1">Channels</div>
                        <ul className="space-y-1">
                            {renderGroupList()}
                        </ul>
                    </div>

                    {individuals.length > 0 && (
                        <div className="px-3 pt-4">
                            <div className="text-gray-500 uppercase text-[11px] font-semibold mb-1">Direct messages</div>
                            <ul className="space-y-1">
                                {renderIndividualList()}
                            </ul>
                        </div>
                    )}
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0">
                <div className="h-14 flex items-center justify-between border-b px-3 flex-shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        <button className="md:hidden p-1 rounded hover:bg-gray-100" onClick={() => setShowList(true)}>
                            <Menu className="w-5 h-5 text-[#a51d34]" />
                        </button>
                        <div className="flex items-center gap-2 min-w-0">
                            {activeChat?.type === "group" ? (
                                <Users className="w-5 h-5 text-[#a51d34]" />
                            ) : (
                                <User className="w-5 h-5 text-[#a51d34]" />
                            )}
                            <div className="font-semibold truncate">
                                {activeChat ? activeChat.name : "Messages"}
                            </div>
                        </div>
                    </div>

                    {activeChat?.type === "group" && (
                        <button
                            onClick={() => {
                                fetchGroupMembers(activeChat.id);
                                setShowMembersModal(true);
                            }}
                            className="px-2 py-1 text-[12px] border border-[#a51d34] text-[#a51d34] rounded hover:bg-red-50"
                        >
                            Members
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-3 bg-white min-h-0">
                    {loadingMessages ? (
                        <div className="h-full flex items-center justify-center text-gray-500">Loading messages...</div>
                    ) : activeChat ? (
                        <>
                            {(chatMessages[activeChat.id] || []).map((m, i) => (
                                <MessageBubble
                                    key={i}
                                    msg={m}
                                    isYou={m.isYou} // Use the isYou flag from the message object
                                    onFileClick={openPreview}
                                />
                            ))}
                            <div ref={messagesEndRef} />
                        </>
                    ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-500">
                            Select a chat to start messaging
                        </div>
                    )}
                </div>

                {activeChat && (
                    <div className="border-t p-2 flex-shrink-0">
                        {files.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {files.map((f, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-1.5 px-2 py-1 border rounded bg-gray-50 text-[11px] max-w-[140px]"
                                    >
                                        <Paperclip className="w-3 h-3 text-[#a51d34]" />
                                        <span className="truncate">{f.name}</span>
                                        <button
                                            onClick={() => removeFile(idx)}
                                            className="ml-auto text-[10px] text-red-500 hover:underline"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-end gap-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <button
                                className="p-2 rounded hover:bg-gray-100 text-gray-600"
                                onClick={handleAttachClick}
                                title="Attach files"
                            >
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <div className="flex-1">
                                <textarea
                                    ref={inputRef}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    onKeyDown={onKeyDown}
                                    rows={1}
                                    placeholder={`Message ${activeChat.name}`}
                                    className="w-full border rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-[#a51d34]"
                                />
                            </div>
                            <button
                                onClick={sendMessage}
                                disabled={!message.trim() && files.length === 0}
                                className={`p-2 rounded-lg flex items-center gap-1 ${message.trim() || files.length > 0
                                    ? "bg-[#a51d34] text-white hover:brightness-110"
                                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                    }`}
                            >
                                <Send className="w-4 h-4" />
                                <span className="hidden sm:inline text-[12px]">Send</span>
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {showMembersModal && activeChat?.type === "group" && (
                <MembersModal
                    members={currentGroupMembers}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    onClose={() => {
                        setShowMembersModal(false);
                        setSearchTerm("");
                    }}
                    onSend={startIndividualChat}
                    getStatusColor={getStatusColor}
                />
            )}

            {previewModal.open && previewModal.file && (
                <FilePreviewModal file={previewModal.file} onClose={closePreview} />
            )}
        </div>
    );
};

const MessageBubble = ({ msg, isYou, onFileClick }) => {
    return (
        <div className={`flex gap-2 mb-3 ${isYou ? "justify-end" : "justify-start"}`}>
            {!isYou && (
                <div className="w-7 h-7 rounded bg-[#a51d34]/10 text-[#a51d34] flex items-center justify-center text-[11px] font-semibold flex-shrink-0">
                    {msg.sender?.charAt(0)}
                </div>
            )}

            <div className={`max-w-[80%] ${isYou ? "flex flex-col items-end" : ""}`}>
                {!isYou && (
                    <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-1">
                        <span className="font-semibold text-gray-700">{msg.sender}</span>
                        <span>{msg.timestamp}</span>
                    </div>
                )}

                <div
                    className={`px-3 py-2 rounded-lg text-[13px] border leading-5 break-words
                        ${isYou
                            ? "bg-[#a51d34] text-white border-[#a51d34] rounded-br-none"
                            : "bg-white text-gray-900 border-gray-200 rounded-bl-none"
                        }`}
                >
                    {msg.text && <div className="whitespace-pre-wrap">{msg.text}</div>}

                    {Array.isArray(msg.files) && msg.files.length > 0 && (
                        <div className={`mt-1 ${isYou ? "text-white" : "text-gray-800"}`}>
                            {msg.files.map((f, idx) => {
                                const isImage = f.type === "image";
                                return (
                                    <div
                                        key={idx}
                                        onClick={() => onFileClick(f)}
                                        className="mt-1 cursor-pointer inline-block"
                                    >
                                        {isImage ? (
                                            <img
                                                src={f.url}
                                                alt={f.fileName}
                                                className="max-w-[180px] max-h-[180px] w-auto h-auto object-contain rounded border border-white/20"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border ${isYou ? "border-white/40" : "border-gray-300"} bg-gray-50`}>
                                                <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span className="text-[12px] truncate max-w-[100px]">{f.fileName}</span>
                                                <Eye className="w-3 h-3 flex-shrink-0" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <div className={`text-[10px] opacity-70 mt-1 ${isYou ? "text-white text-right" : "text-gray-500"}`}>
                        {msg.timestamp}
                    </div>
                </div>
            </div>

            {isYou && (
                <div className="w-7 h-7 rounded bg-[#a51d34] text-white flex items-center justify-center text-[11px] font-semibold flex-shrink-0">
                    {msg.sender?.charAt(0)}
                </div>
            )}
        </div>
    );
};

const FilePreviewModal = ({ file, onClose }) => {
    const isImage = file.type === "image";

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative">
                <div className="flex justify-between items-center p-3 border-b">
                    <span className="font-medium truncate max-w-[80%]">{file.fileName}</span>
                    <div className="flex gap-2">
                        <a
                            href={file.url}
                            target="_blank"
                            download={file.fileName}
                            className="p-1.5 rounded hover:bg-gray-100"
                            title="Download"
                        >
                            <Download className="w-4 h-4 text-gray-700" />
                        </a>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded hover:bg-gray-100"
                            title="Close"
                        >
                            <X className="w-4 h-4 text-gray-700" />
                        </button>
                    </div>
                </div>

                <div className="p-4 overflow-auto max-h-[70vh] flex items-center justify-center bg-gray-50">
                    {isImage ? (
                        <img
                            src={file.url}
                            alt={file.fileName}
                            className="max-w-full max-h-[60vh] object-contain"
                            onError={(e) => {
                                e.target.parentElement.innerHTML = `<div class="text-center text-red-500">Failed to load image</div>`;
                            }}
                        />
                    ) : (
                        <div className="text-center py-8 px-6">
                            <Paperclip className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 mb-4 font-medium">{file.fileName}</p>
                            <a
                                href={file.url}
                                download={file.fileName}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#a51d34] text-white rounded hover:brightness-110"
                            >
                                <Download className="w-4 h-4" />
                                Download File
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const MembersModal = ({ 
    members, 
    searchTerm, 
    setSearchTerm, 
    onClose, 
    onSend, 
    getStatusColor 
}) => {
    // Filter members to show only students
    const filteredMembers = members.filter(member => 
        member.role === "Student" || 
        member.role === "student" || 
        member.role?.toLowerCase() === "student"
    );

    // Filter based on search term
    const filteredStudents = filteredMembers.filter((student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
                <div className="flex justify-between items-center p-4 border-b bg-[#a51d34] text-white rounded-t-lg">
                    <span className="font-semibold">Group Members</span>
                    <button onClick={onClose}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-3 border-b">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search students"
                            className="w-full pl-7 pr-3 py-2 border rounded text-[13px] focus:ring-1 focus:ring-[#a51d34]"
                        />
                    </div>
                </div>

                <div className="p-3 max-h-[65vh] overflow-y-auto space-y-2">
                    {filteredStudents.length ? (
                        filteredStudents.map((student) => (
                            <div key={student._id} className="flex items-center gap-3 p-2 border rounded-lg">
                                <div className="w-8 h-8 rounded-full bg-[#a51d34]/10 text-[#a51d34] flex items-center justify-center font-semibold">
                                    {student.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold text-[13px]">{student.name}</div>
                                    <div className="text-xs text-gray-500">{student.role}</div>
                                </div>
                                <button
                                    onClick={() => onSend(student)}
                                    className="ml-2 px-2 py-1 text-[12px] rounded border border-[#a51d34] text-[#a51d34] hover:bg-red-50"
                                >
                                    Send
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 py-6 text-sm">No students found</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MentorChats;