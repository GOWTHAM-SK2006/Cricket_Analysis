"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bot,
  X,
  Send,
  Loader2,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  User,
  Activity,
  Zap,
  Download,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string | null;
}

const QUICK_SUGGESTIONS = [
  { label: "📊 Low to High CPI", prompt: "please give all players from low to high" },
  { label: "📄 Generate Report", prompt: "generate report for player dhoni for last 2 days" },
  { label: "⭐ Top Performers", prompt: "Show top performing players by CPI score" },
  { label: "⚠️ Needs Attention", prompt: "Which players need attention right now?" },
  { label: "🏏 Practice Drills", prompt: "Suggest top practice drills for improvement" },
];

export default function AIChatModal({ isOpen, onClose, userRole }: AIChatModalProps) {
  const [chatInput, setChatInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: "init-1",
      sender: "bot",
      text: "Hello! I am your **AI Cricket Coach**. How can I assist you with player performance, practice drills, or match strategies today?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, chatMessages, isSending]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || chatInput).trim();
    if (!messageText || isSending) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: "user",
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setChatInput("");
    setChatMessages((prev) => [...prev, userMsg]);
    setIsSending(true);

    try {
      const res = await api.post("/ai/chat", {
        sessionId: "dash_session_user",
        userRole: userRole === "player" ? "PLAYER" : "COACH",
        message: messageText
      });

      let botReply = "AI Service is temporarily unavailable.";
      if (res && res.data && res.data.reply) {
        botReply = res.data.reply;
      } else if (res && res.data && res.data.message) {
        botReply = res.data.message;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "bot",
          text: botReply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || err?.response?.data?.reply || "AI Service is temporarily unavailable.";
      setChatMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text: errorMsg,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = () => {
    setChatMessages([
      {
        id: `init-${Date.now()}`,
        sender: "bot",
        text: "Conversation refreshed. How else can I assist your cricket coaching today?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadPDF = async (msgId: string, msgText: string) => {
    setDownloadingId(msgId);
    try {
      const jsPDF = (await import("jspdf")).default;
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const lines = msgText.split("\n").map(l => l.trim()).filter(Boolean);
      let title = "Player Performance Report";
      if (lines.length > 0) {
        const cleanFirstLine = lines[0].replace(/\*\*/g, "");
        if (cleanFirstLine.toLowerCase().includes("report")) {
          title = cleanFirstLine;
        }
      }

      // Header Banner (Dark Slate with Orange Accent)
      doc.setFillColor(15, 23, 42); // Slate 900
      doc.rect(0, 0, pageWidth, 24, "F");

      doc.setFillColor(249, 115, 22); // Orange 500 Stripe
      doc.rect(0, 23, pageWidth, 1.5, "F");

      // Title & Subtitle
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text("CRICKET PERFORMANCE INDEX (CPI)", 14, 11);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(203, 213, 225);
      doc.text("Official AI Generated Player Analytics & Performance Report", 14, 18);

      // Date
      const dateStr = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      doc.setFontSize(8);
      doc.text(`Generated: ${dateStr}`, pageWidth - 14, 15, { align: "right" });

      let y = 34;

      // Report Header Pill
      doc.setFillColor(255, 247, 237); // Orange 50
      doc.roundedRect(14, y - 6, pageWidth - 28, 14, 2, 2, "F");
      doc.setDrawColor(254, 215, 170); // Orange 200
      doc.roundedRect(14, y - 6, pageWidth - 28, 14, 2, 2, "S");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(194, 65, 12); // Orange 700
      doc.text(title.toUpperCase(), 20, y + 3);
      y += 18;

      doc.setFontSize(9.5);

      lines.forEach((line) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }

        const cleanLine = line.replace(/\*\*/g, "");

        if ((line.startsWith("**") && line.endsWith("**") && line.length < 50) || (cleanLine.endsWith(":") && cleanLine.length < 35)) {
          y += 2;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(234, 88, 12);
          doc.text(cleanLine, 14, y);
          y += 6;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.setTextColor(30, 41, 59);
        } else if (cleanLine.startsWith("- ") || cleanLine.startsWith("* ")) {
          const bulletText = cleanLine.substring(2);
          const wrapped = doc.splitTextToSize(bulletText, pageWidth - 32);

          doc.setFillColor(249, 115, 22);
          doc.circle(17, y - 1.5, 1, "F");

          doc.setFont("helvetica", "normal");
          doc.setTextColor(30, 41, 59);
          doc.text(wrapped, 21, y);
          y += wrapped.length * 5 + 2;
        } else {
          const wrapped = doc.splitTextToSize(cleanLine, pageWidth - 28);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(30, 41, 59);
          doc.text(wrapped, 14, y);
          y += wrapped.length * 5 + 2;
        }
      });

      // Footer Page Numbering
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("Cricket Performance Index (CPI) • Confidential Player Report", 14, pageHeight - 8);
        doc.text(`Page ${p} of ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: "right" });
      }

      const filename = `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`;
      doc.save(filename);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const isReportMessage = (msg: Message, idx: number) => {
    if (msg.sender !== "bot") return false;
    const textLower = msg.text.toLowerCase();
    
    // Previous user prompt check
    const prevMsg = idx > 0 ? chatMessages[idx - 1] : null;
    const prevUserText = prevMsg && prevMsg.sender === "user" ? prevMsg.text.toLowerCase().trim() : "";

    // Ignore greetings, thank yous, and acknowledgments
    const isGreetingOrThanks =
      prevUserText.includes("thank") ||
      prevUserText === "hi" ||
      prevUserText === "hello" ||
      prevUserText === "hey" ||
      prevUserText === "ok" ||
      prevUserText === "okay";

    if (isGreetingOrThanks) return false;

    const userAskedReport =
      prevUserText.includes("report") ||
      prevUserText.includes("generate report") ||
      prevUserText.includes("pdf report") ||
      prevUserText.includes("download report");

    const botIsFormalReport =
      textLower.includes("player report:") ||
      textLower.includes("performance report:") ||
      (textLower.includes("overview") && textLower.includes("performance indices"));

    return userAskedReport || botIsFormalReport;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.35, bounce: 0.1 }}
          className="bg-white border border-slate-200/90 rounded-3xl w-full max-w-xl h-[620px] max-h-[90vh] flex flex-col overflow-hidden shadow-2xl shadow-orange-500/10"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex justify-between items-center relative overflow-hidden border-b border-slate-700/50">
            {/* Subtle background glow */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-3.5 z-10">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-slate-950 shadow-md shadow-orange-500/30 font-bold border border-orange-300/40">
                  <Bot className="w-6 h-6 stroke-[2.2]" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping opacity-75" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black tracking-wider uppercase text-white">AI CRICKET COACH</h3>
                  <span className="text-[10px] font-extrabold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full tracking-wide">
                    PRO
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[11px] text-slate-300 font-medium">Smart Performance & Analytics Engine</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 z-10">
              <button
                onClick={handleClearChat}
                title="Reset Conversation"
                className="text-slate-400 hover:text-orange-400 hover:bg-slate-800/80 p-2 rounded-xl transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                title="Close Modal"
                className="text-slate-400 hover:text-white hover:bg-slate-800/80 p-2 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Action Suggestion Chips Header Row */}
          <div className="bg-slate-50/80 border-b border-slate-100 px-4 py-2.5 overflow-x-auto no-scrollbar flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-orange-500" /> Prompts:
            </span>
            {QUICK_SUGGESTIONS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(chip.prompt)}
                disabled={isSending}
                className="shrink-0 bg-white hover:bg-orange-50 border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-700 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer flex items-center gap-1"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/30">
            {chatMessages.map((msg, idx) => {
              const isReport = isReportMessage(msg, idx);
              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"} group`}
                >
                  {msg.sender === "bot" && (
                    <div className="w-7 h-7 rounded-xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <Bot className="w-4 h-4 stroke-[2.2]" />
                    </div>
                  )}

                  <div className={`relative max-w-[85%] ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                    <div
                      className={`p-3.5 text-xs leading-relaxed font-medium rounded-2xl shadow-xs transition-all ${
                        msg.sender === "user"
                          ? "bg-gradient-to-r from-orange-500 to-amber-600 text-slate-950 font-bold rounded-tr-xs border border-orange-400/40 shadow-orange-500/15"
                          : "bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs w-full"
                      }`}
                    >
                      {msg.sender === "user" ? (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        <>
                          {parseBotMarkdown(msg.text)}

                          {/* DOWNLOAD PDF BUTTON */}
                          {isReport && (
                            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
                                <FileText className="w-4 h-4 text-orange-500 shrink-0" />
                                <span>Player PDF Report Ready</span>
                              </div>
                              <button
                                onClick={() => handleDownloadPDF(msg.id, msg.text)}
                                disabled={downloadingId === msg.id}
                                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-extrabold px-3 py-1.5 rounded-xl text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                {downloadingId === msg.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                                )}
                                <span>Download PDF</span>
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className={`flex items-center gap-2 mt-1 px-1 text-[10px] text-slate-400 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <span>{msg.timestamp}</span>
                      {msg.sender === "bot" && (
                        <button
                          onClick={() => handleCopyText(msg.id, msg.text)}
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-orange-500 transition-opacity p-0.5 cursor-pointer"
                          title="Copy message"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex justify-start gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-orange-100 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white border border-slate-200 text-slate-600 px-4 py-3 rounded-2xl rounded-tl-xs text-xs flex items-center gap-3 shadow-xs">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" />
                  </div>
                  <span className="font-semibold text-slate-500">Analyzing player stats & metrics...</span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3.5 bg-white border-t border-slate-200/80 flex items-center gap-2 shadow-inner"
          >
            <div className="flex-1 relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about batting, bowling, drills, CPI rankings..."
                className="w-full bg-slate-50 border border-slate-300/80 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 rounded-2xl px-4 py-3 text-xs text-slate-900 placeholder-slate-400 transition-all outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={isSending || !chatInput.trim()}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-40 disabled:hover:from-orange-500 disabled:hover:to-amber-500 text-slate-950 font-extrabold px-4 py-3 rounded-2xl text-xs transition-all shadow-md shadow-orange-500/20 active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Markdown parser helper specifically tuned for sleek bot responses with high quality styling
const parseBotMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  
  const boldRegex = /\*\*(.*?)\*\*/g;
  
  const renderFormattedText = (txt: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    boldRegex.lastIndex = 0;
    
    while ((match = boldRegex.exec(txt)) !== null) {
      if (match.index > lastIndex) {
        parts.push(txt.substring(lastIndex, match.index));
      }
      
      const content = match[1];
      // Check if text is CPI or score highlight
      const isCpiMatch = /CPI:\s*[\d\.]+/i.test(content) || /^CPI/i.test(content);

      parts.push(
        <strong
          key={match.index}
          className={`font-black ${
            isCpiMatch
              ? "text-orange-600 bg-orange-100/80 px-1.5 py-0.5 rounded border border-orange-300/60 font-mono text-[11px]"
              : "text-orange-600 font-extrabold"
          }`}
        >
          {content}
        </strong>
      );
      lastIndex = boldRegex.lastIndex;
    }
    
    if (lastIndex < txt.length) {
      parts.push(txt.substring(lastIndex));
    }
    return parts.length > 0 ? <>{parts}</> : txt;
  };

  let listItems: React.ReactNode[] = [];
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (inList) {
        elements.push(
          <ul key={`list-${i}`} className="my-2 space-y-1.5 pl-1">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }
      continue;
    }

    // Bullet point list check
    if (line.startsWith("* ") || line.startsWith("- ")) {
      inList = true;
      const content = line.substring(2);
      listItems.push(
        <li key={`li-${i}`} className="flex items-start gap-2 text-slate-700 leading-snug">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-1.5" />
          <span>{renderFormattedText(content)}</span>
        </li>
      );
    } else {
      if (inList) {
        elements.push(
          <ul key={`list-${i}`} className="my-2 space-y-1.5 pl-1">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
      }

      // Markdown Table check
      if (line.startsWith("|") && line.endsWith("|")) {
        const tableRows: string[] = [];
        while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
          tableRows.push(lines[i].trim());
          i++;
        }
        i--; // Adjust index

        if (tableRows.length > 0) {
          const parsedRows = tableRows.map((row) =>
            row
              .split("|")
              .map((cell) => cell.trim())
              .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
          );

          const hasSeparator =
            parsedRows.length > 1 && parsedRows[1].every((cell) => cell.startsWith("-") || cell.includes("---"));
          const headerRow = parsedRows[0];
          const dataRows = parsedRows.slice(hasSeparator ? 2 : 1);

          elements.push(
            <div key={`table-${i}`} className="overflow-x-auto my-3 border border-orange-200/80 rounded-2xl shadow-2xs">
              <table className="min-w-full divide-y divide-orange-100 text-[11px]">
                <thead className="bg-orange-50/80">
                  <tr>
                    {headerRow.map((cell, idx) => (
                      <th
                        key={idx}
                        className="px-3 py-2 text-left font-black text-orange-950 uppercase tracking-wider border-r border-orange-200/50 last:border-r-0"
                      >
                        {renderFormattedText(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {dataRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-orange-50/30 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-slate-700 border-r border-slate-100 last:border-r-0">
                          {renderFormattedText(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
      } else {
        // Standard text line / paragraph
        elements.push(
          <p key={`p-${i}`} className="my-1 text-slate-800 leading-relaxed">
            {renderFormattedText(line)}
          </p>
        );
      }
    }
  }

  if (inList) {
    elements.push(
      <ul key="list-end" className="my-2 space-y-1.5 pl-1">
        {listItems}
      </ul>
    );
  }

  return <div className="space-y-1">{elements}</div>;
};
