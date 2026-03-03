"use client";

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';
import { Bot, User, FileText, Loader2, Send, Minimize2, ArrowRight, BookOpen, X, Play, Info, Sparkles, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
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

    if (!svg) return <div className="animate-pulse bg-zinc-100 h-32 rounded-lg flex items-center justify-center text-sm text-zinc-400">Loading diagram...</div>;

    return <div className="my-4 overflow-x-auto bg-white p-4 rounded-xl border border-zinc-200 shadow-sm" dangerouslySetInnerHTML={{ __html: svg }} />;
};

interface Message {
    role: "user" | "assistant";
    content: string;
    sources?: any[];
    image?: string; // base64 encoded image
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
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedSource, setSelectedSource] = useState<any | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('画像ファイルを選択してください');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setSelectedImage(event.target.result as string);
            }
        };
        reader.readAsDataURL(file);
        // Reset input value so the same file can be selected again if removed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (text: string = input) => {
        if (!text.trim() && !selectedImage) return;

        const userMessage: Message = { role: "user", content: text, ...(selectedImage && { image: selectedImage }) };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        const imageToSubmit = selectedImage; // Store local ref for the API call
        setSelectedImage(null);
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

            const apiMessages = [{
                role: "user",
                content: text,
                ...(imageToSubmit && { image: imageToSubmit })
            }];

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

    const MarkdownRenderer = ({ content, isUser }: { content: string, isUser?: boolean }) => (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
                code(props) {
                    const { children, className, node, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || '');
                    if (!match) return <code className={`px-1.5 py-0.5 rounded text-[0.9em] ${isUser ? 'bg-white/20 text-white' : 'bg-zinc-100 text-indigo-600'}`} {...rest}>{children}</code>;

                    if (match[1] === 'mermaid') {
                        return <Mermaid chart={String(children).replace(/\n$/, '')} />;
                    }
                    return (
                        <div className="relative my-4 group shadow-sm">
                            <div className="absolute top-0 right-0 px-2 py-1 text-xs text-zinc-500 bg-zinc-100 rounded-bl-lg rounded-tr-lg">{match[1]}</div>
                            <pre className="bg-zinc-50 p-4 rounded-xl overflow-x-auto border border-zinc-200">
                                <code className={`${className} text-zinc-800 text-sm`} {...rest}>
                                    {children}
                                </code>
                            </pre>
                        </div>
                    );
                },
                a: ({ node, ...props }) => <a className={`${isUser ? 'text-white underline' : 'text-indigo-600 hover:text-indigo-500 underline'} underline-offset-2 transition-colors`} {...props} />,
                h1: ({ node, ...props }) => <h1 className={`text-2xl font-bold mt-6 mb-4 ${isUser ? 'text-white' : 'text-zinc-900'}`} {...props} />,
                h2: ({ node, ...props }) => <h2 className={`text-xl font-bold mt-5 mb-3 border-b pb-2 ${isUser ? 'text-white border-white/20' : 'text-zinc-800 border-zinc-200'}`} {...props} />,
                h3: ({ node, ...props }) => <h3 className={`text-lg font-bold mt-4 mb-2 ${isUser ? 'text-white' : 'text-zinc-800'}`} {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-5 my-3 space-y-1" {...props} />,
                ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-5 my-3 space-y-1" {...props} />,
                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                p: ({ node, ...props }) => <p className="leading-relaxed mb-4 last:mb-0" {...props} />,
                blockquote: ({ node, ...props }) => <blockquote className={`border-l-4 pl-4 py-1 my-4 rounded-r-lg ${isUser ? 'border-white/40 bg-white/10' : 'border-indigo-400 bg-indigo-50 text-zinc-600'}`} {...props} />,
                table: ({ node, ...props }) => <div className="overflow-x-auto my-4 border border-zinc-200 rounded-lg shadow-sm"><table className="w-full text-left border-collapse bg-white" {...props} /></div>,
                th: ({ node, ...props }) => <th className={`p-3 border-b font-semibold text-sm ${isUser ? 'border-white/20 bg-white/10' : 'border-zinc-200 bg-zinc-50 text-zinc-800'}`} {...props} />,
                td: ({ node, ...props }) => <td className={`p-3 border-b text-sm last:border-0 ${isUser ? 'border-white/20' : 'border-zinc-200 text-zinc-700'}`} {...props} />,
            }}
        >
            {content}
        </ReactMarkdown>
    );

    const SourceCards = ({ sources }: { sources: any[] }) => {
        if (!sources || sources.length === 0) return null;

        return (
            <div className="mt-5 border-t border-zinc-200/60 pt-4">
                <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400 mb-3 uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5" />
                    参考ナレッジ ({sources.length})
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 pt-1 px-1 -mx-1 snap-x scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-transparent">
                    {sources.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedSource(s)}
                            className="snap-start flex-shrink-0 w-64 text-left group bg-white hover:bg-zinc-50 border border-zinc-200/80 hover:border-indigo-300 rounded-xl p-3.5 transition-all duration-300 flex flex-col gap-2 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_16px_-6px_rgba(0,0,0,0.1)] hover:-translate-y-0.5"
                        >
                            <div className="font-semibold text-indigo-700 text-xs line-clamp-1 group-hover:text-indigo-600">{s.title || s.category}</div>
                            <div className="text-zinc-500 text-[11px] leading-relaxed line-clamp-3">{s.text.replace(/#/g, '').substring(0, 100)}...</div>
                            <div className="mt-auto pt-2 flex items-center text-[10px] text-indigo-500 font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                                詳しく見る <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="relative flex flex-col h-[100dvh] font-sans bg-zinc-50 overflow-hidden text-zinc-800 selection:bg-indigo-500/20">
            {/* Soft Light Aurora Background */}
            <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/10 blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-400/10 blur-[100px]" />
            </div>

            {/* Header */}
            <header className="px-6 py-4 border-b border-zinc-200/60 bg-white/60 backdrop-blur-xl sticky top-0 z-20 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-md">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-[17px] font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 to-sky-700 tracking-tight leading-tight">Obsidian Master AI</h1>
                        <p className="text-[10px] text-zinc-500 tracking-wider font-semibold uppercase leading-tight mt-0.5">Intelligent Knowledge Assistant</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden flex flex-col max-w-4xl mx-auto w-full relative z-10">
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth custom-scrollbar">
                    {messages.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full flex flex-col items-center justify-center text-center space-y-8 max-w-2xl mx-auto"
                        >
                            <div className="w-24 h-24 bg-gradient-to-tr from-indigo-50 to-sky-50 rounded-3xl flex items-center justify-center border border-zinc-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-100 to-sky-100 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                <Bot className="w-12 h-12 text-indigo-600 relative z-10" />
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 via-indigo-600 to-sky-600 tracking-tight">
                                    Obsidianのすべてを、<br className="md:hidden" />あなたに。
                                </h2>
                                <p className="text-lg text-zinc-500 font-medium max-w-lg mx-auto leading-relaxed">
                                    Zettelkastenから同期設定まで、世界最高のエージェントが完璧にお答えします。
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl mt-8 pt-4">
                                {FAQ_SUGGESTIONS.map((faq, i) => (
                                    <motion.button
                                        key={i}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.2 + (i * 0.1), duration: 0.4 }}
                                        onClick={() => handleSubmit(faq.text)}
                                        whileHover={{ scale: 1.02, backgroundColor: "inherit" }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex items-center gap-3 text-sm bg-white border border-zinc-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 px-5 py-4 rounded-2xl text-zinc-700 transition-all shadow-sm text-left group"
                                    >
                                        <span className="text-xl group-hover:scale-110 transition-transform duration-300">{faq.icon}</span>
                                        <span className="font-medium tracking-wide">{faq.text}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="space-y-8 max-w-3xl mx-auto pb-4">
                            <AnimatePresence initial={false}>
                                {messages.map((message, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className={`flex items-start gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                                    >
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${message.role === 'user'
                                            ? 'bg-gradient-to-tr from-sky-500 to-indigo-500 ring-2 ring-indigo-500/10'
                                            : 'bg-white ring-1 ring-zinc-200/80 shadow-md'
                                            }`}>
                                            {message.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-indigo-600" />}
                                        </div>
                                        <div className={`flex flex-col gap-2 max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`p-5 rounded-3xl shadow-sm ${message.role === 'user'
                                                ? 'bg-indigo-600 text-white rounded-tr-sm shadow-indigo-600/10'
                                                : 'bg-white text-zinc-800 rounded-tl-sm border border-zinc-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]'
                                                } markdown-body overflow-hidden leading-relaxed text-[15px]`}>
                                                {message.image && (
                                                    <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
                                                        <img src={message.image} alt="User attachment" className="max-w-full h-auto max-h-60 object-contain" />
                                                    </div>
                                                )}
                                                <MarkdownRenderer content={message.content} isUser={message.role === 'user'} />
                                            </div>
                                            {message.sources && message.sources.length > 0 && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.3, duration: 0.8 }}
                                                    className="w-full pl-2"
                                                >
                                                    <SourceCards sources={message.sources} />
                                                </motion.div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-start gap-4"
                                >
                                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shrink-0 border border-zinc-200 shadow-sm animate-pulse">
                                        <Bot className="w-5 h-5 text-indigo-400" />
                                    </div>
                                    <div className="px-5 py-4 bg-white rounded-3xl rounded-tl-sm border border-zinc-200/80 shadow-sm flex items-center gap-3">
                                        <div className="flex space-x-1.5 p-1">
                                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                            <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            <div ref={messagesEndRef} className="h-4" />
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <footer className="px-4 py-6 border-t border-zinc-200/60 bg-white/80 backdrop-blur-xl relative z-20">
                    <div className="max-w-3xl mx-auto w-full">
                        {/* Welcome/Empty State Suggestions */}
                        {messages.length === 1 && (
                            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none sm:justify-center px-2">
                                {FAQ_SUGGESTIONS.map((faq, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSubmit(faq.text)}
                                        className="whitespace-nowrap flex items-center gap-2 text-sm bg-white hover:bg-zinc-50 border border-zinc-200 hover:border-indigo-300 px-4 py-2.5 rounded-full text-zinc-600 hover:text-indigo-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                                    >
                                        <span className="text-base">{faq.icon}</span> <span className="font-medium">{faq.text}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {selectedImage && (
                            <div className="mb-3 p-2 bg-white rounded-xl border border-zinc-200 inline-flex items-start relative shadow-sm">
                                <img src={selectedImage} alt="Preview" className="h-16 w-auto rounded-lg object-contain" />
                                <button
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute -top-2 -right-2 bg-zinc-800 text-white rounded-full p-1 shadow-md hover:bg-zinc-700 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}

                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
                            className="relative flex items-center bg-white rounded-2xl border border-zinc-300 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] transition-all duration-300"
                        >
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-indigo-600 p-2 transition-colors rounded-xl hover:bg-zinc-50"
                            >
                                <ImageIcon className="w-5 h-5" />
                            </button>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Zettelkastenとは何ですか？"
                                className="w-full bg-transparent py-4 pl-12 pr-14 outline-none text-zinc-800 placeholder-zinc-400 text-[15px] font-medium"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 disabled:grayscale disabled:active:scale-100 text-white p-2 md:p-2.5 rounded-xl transition-all flex items-center justify-center shadow-md shadow-indigo-600/20"
                            >
                                <Send className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />
                            </button>
                        </form>
                        <div className="text-center mt-3 text-[11px] text-zinc-400 font-medium tracking-wide">
                            Answers are powered by a curated Obsidian Knowledge Base.
                        </div>
                    </div>
                </footer>

                {/* Source Detail Modal */}
                {selectedSource && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-900/40 backdrop-blur-sm" onClick={() => setSelectedSource(null)}>
                        <div
                            className="w-full max-w-3xl max-h-[90vh] bg-white border border-zinc-200 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="px-6 py-5 flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600 shadow-sm border border-indigo-200/50">
                                        <Info className="w-5 h-5" />
                                    </div>
                                    <h2 className="font-bold text-zinc-800 text-lg">{selectedSource.title || selectedSource.category || "ソース詳細"}</h2>
                                </div>
                                <button onClick={() => setSelectedSource(null)} className="p-2 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-all active:scale-95">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="p-8 overflow-y-auto flex-1 bg-white">
                                <div className="prose prose-zinc max-w-none text-[15px] leading-relaxed">
                                    <MarkdownRenderer content={selectedSource.text} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
