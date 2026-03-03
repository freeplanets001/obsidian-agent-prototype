"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, BookOpen, X, Play, Info, Sparkles } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    fontFamily: 'inherit'
});

const Mermaid = ({ chart }: { chart: string }) => {
    const [svg, setSvg] = useState<string>('');

    useEffect(() => {
        let isMounted = true;
        const renderChart = async () => {
            try {
                const id = `mermaid-${Math.random().toString(36).substring(2)}`;
                const { svg } = await mermaid.render(id, chart);
                if (isMounted) setSvg(svg);
            } catch (e) {
                console.error('Mermaid render error', e);
            }
        };
        renderChart();
        return () => { isMounted = false; };
    }, [chart]);

    if (!svg) return <div className="animate-pulse bg-gray-800/50 h-32 rounded-lg flex items-center justify-center text-sm text-gray-500">Loading diagram...</div>;

    return <div className="my-4 overflow-x-auto bg-gray-900/50 p-4 rounded-xl border border-gray-700/50" dangerouslySetInnerHTML={{ __html: svg }} />;
};

interface Message {
    role: "user" | "assistant";
    content: string;
    sources?: any[];
}

const FAQ_SUGGESTIONS = [
    { icon: "📝", text: "Markdownの書き方は？" },
    { icon: "📊", text: "Dataviewで何ができる？" },
    { icon: "🧠", text: "Zettelkastenって何？" },
    { icon: "☁️", text: "iCloud同期の注意点は？" },
    { icon: "🎨", text: "見た目をカスタマイズしたい" }
];

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "こんにちは！Obsidianを極めるための専門AIエージェントです。\nZettelkastenやプラグインの設定、効率的なノート管理術など、何でも聞いてください。"
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSource, setSelectedSource] = useState<any | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleSubmit = async (text: string = input) => {
        if (!text.trim()) return;

        const userMessage: Message = { role: "user", content: text };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const searchRes = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: text })
            });
            const searchData = await searchRes.json();
            const contextDocs = searchData.results || [];

            const contextString = contextDocs.map((doc: any, i: number) =>
                `[Source ${i + 1} - ${doc.title}]\n${doc.text}`
            ).join('\n\n');

            const apiMessages = [{ role: "user", content: text }];

            const chatRes = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: apiMessages,
                    context: contextString
                })
            });

            const chatData = await chatRes.json();

            setMessages(prev => [...prev, {
                role: "assistant",
                content: chatData.reply || "エラーが発生しました。",
                sources: contextDocs
            }]);

        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, { role: "assistant", content: "申し訳ありません。通信エラーが発生しました。" }]);
        } finally {
            setIsLoading(false);
        }
    };

    const MarkdownRenderer = ({ content }: { content: string }) => (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                code(props) {
                    const { children, className, node, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || '');
                    if (!match) return <code className="bg-gray-800/80 px-1.5 py-0.5 rounded text-purple-300 text-[0.9em]" {...rest}>{children}</code>;

                    if (match[1] === 'mermaid') {
                        return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                    }
                    return (
                        <div className="relative my-4 group">
                            <div className="absolute top-0 right-0 px-2 py-1 text-xs text-gray-500 bg-gray-800 rounded-bl-lg rounded-tr-lg opacity-80">{match[1]}</div>
                            <pre className="bg-gray-900/80 p-4 rounded-xl overflow-x-auto border border-gray-700/50">
                                <code className={className} {...rest}>
                                    {children}
                                </code>
                            </pre>
                        </div>
                    );
                },
                a: ({ node, ...props }) => <a className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors" {...props} />,
                h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-white" {...props} />,
                h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3 text-gray-100 border-b border-gray-700/50 pb-2" {...props} />,
                h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-4 mb-2 text-gray-200" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-5 my-3 space-y-1 text-gray-300" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-5 my-3 space-y-1 text-gray-300" {...props} />,
                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                p: ({ node, ...props }) => <p className="leading-7 text-gray-300 mb-4 last:mb-0" {...props} />,
                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-purple-500/50 pl-4 py-1 my-4 bg-purple-500/5 rounded-r-lg text-gray-400" {...props} />,
                table: ({ node, ...props }) => <div className="overflow-x-auto my-4 border border-gray-700/50 rounded-lg"><table className="w-full text-left border-collapse bg-gray-800/20" {...props} /></div>,
                th: ({ node, ...props }) => <th className="p-3 border-b border-gray-700/50 bg-gray-800/40 text-gray-200 font-semibold text-sm" {...props} />,
                td: ({ node, ...props }) => <td className="p-3 border-b border-gray-700/50 text-gray-300 text-sm last:border-0" {...props} />,
            }}
        >
            {content}
        </ReactMarkdown>
    );

    const SourceCards = ({ sources }: { sources: any[] }) => {
        if (!sources || sources.length === 0) return null;

        return (
            <div className="mt-6 border-t border-gray-700/50 pt-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5" />
                    参考ナレッジ ({sources.length})
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                    {sources.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedSource(s)}
                            className="flex-shrink-0 w-64 text-left group bg-gray-800/30 hover:bg-gray-700/40 border border-gray-700/50 hover:border-purple-500/30 rounded-xl p-3 transition-all duration-300 flex flex-col gap-2"
                        >
                            <div className="font-semibold text-purple-300 text-xs line-clamp-1 group-hover:text-purple-200">{s.title || s.category}</div>
                            <div className="text-gray-400 text-[11px] leading-relaxed line-clamp-3">{s.text.replace(/#/g, '').substring(0, 100)}...</div>
                            <div className="mt-auto pt-2 flex items-center text-[10px] text-blue-400 opacity-70 group-hover:opacity-100 transition-opacity">
                                詳しく見る <Play className="w-2.5 h-2.5 ml-1" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="relative flex flex-col h-screen font-sans bg-[#0c0e14] overflow-hidden text-gray-100 selection:bg-purple-500/30">
            {/* Aurora Background */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-purple-600/10 blur-[120px] mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] mix-blend-screen" />
            </div>

            {/* Header */}
            <header className="px-6 py-4 border-b border-gray-800/50 bg-[#0c0e14]/60 backdrop-blur-xl sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.3)] border border-white/10">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400 tracking-tight">Obsidian Master AI</h1>
                        <p className="text-[10px] text-gray-400 tracking-wider font-medium uppercase">Intelligent Knowledge Assistant</p>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:px-10 space-y-8 max-w-5xl mx-auto w-full">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                        {/* Avatar */}
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === "user" ? "bg-blue-600/90 border border-blue-500/50" : "bg-purple-600/90 border border-purple-500/50"
                            }`}>
                            {msg.role === "user" ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[100%] sm:max-w-[85%] rounded-2xl p-5 ${msg.role === "user"
                                ? "bg-blue-600/10 border border-blue-500/20 text-gray-100 rounded-tr-sm"
                                : "bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 text-gray-200 rounded-tl-sm shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
                            }`}>
                            <div className="text-[15px]">
                                <MarkdownRenderer content={msg.content} />
                            </div>

                            {/* Sources */}
                            {msg.role === "assistant" && msg.sources && (
                                <SourceCards sources={msg.sources} />
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-4 max-w-5xl mx-auto w-full">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-600/90 border border-purple-500/50 flex items-center justify-center flex-shrink-0 shadow-lg">
                            <Bot className="w-5 h-5 text-white animate-pulse" />
                        </div>
                        <div className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl rounded-tl-sm p-5 flex gap-2 items-center shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </main>

            {/* Input Area */}
            <footer className="px-4 py-6 border-t border-gray-800/50 bg-[#0c0e14]/80 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto w-full">
                    {/* Welcome/Empty State Suggestions */}
                    {messages.length === 1 && (
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none sm:justify-center">
                            {FAQ_SUGGESTIONS.map((faq, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSubmit(faq.text)}
                                    className="whitespace-nowrap flex items-center gap-2 text-sm bg-gray-800/40 hover:bg-gray-700/60 border border-gray-700/50 hover:border-purple-500/40 px-4 py-2.5 rounded-xl text-gray-300 transition-all shadow-sm"
                                >
                                    <span className="text-base">{faq.icon}</span> {faq.text}
                                </button>
                            ))}
                        </div>
                    )}

                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
                        className="relative flex items-center"
                    >
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Zettelkastenとは何ですか？"
                            className="w-full bg-gray-900/50 backdrop-blur-md border border-gray-700/50 hover:border-gray-600 focus:border-purple-500 rounded-2xl py-4 pl-6 pr-14 outline-none text-gray-100 placeholder-gray-500 shadow-inner transition-all text-[15px]"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 disabled:grayscale text-white p-2.5 rounded-xl transition-all flex items-center justify-center shadow-lg"
                        >
                            <Send className="w-4 h-4 ml-0.5" />
                        </button>
                    </form>
                    <div className="text-center mt-3 text-[10px] text-gray-500 font-medium">
                        Responses are generated by Claude using a curated Obsidian Knowledge Base.
                    </div>
                </div>
            </footer>

            {/* Source Detail Modal (Slide over or pop up) */}
            {selectedSource && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0c0e14]/80 backdrop-blur-md" onClick={() => setSelectedSource(null)}>
                    <div
                        className="w-full max-w-4xl max-h-[90vh] bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 flex items-center justify-between border-b border-gray-800 bg-gray-800/20">
                            <div className="flex items-center gap-3">
                                <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400">
                                    <Info className="w-5 h-5" />
                                </div>
                                <h2 className="font-bold text-gray-100">{selectedSource.title || selectedSource.category || "ソース詳細"}</h2>
                            </div>
                            <button onClick={() => setSelectedSource(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="prose prose-invert max-w-none text-[15px]">
                                <MarkdownRenderer content={selectedSource.text} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
