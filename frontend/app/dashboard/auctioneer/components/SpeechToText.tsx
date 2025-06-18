"use client";

import React, { useState, useEffect } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";

interface SpeechToTextProps {
    onTranscriptionChange: (text: string) => void;
    isActive: boolean;
}

export default function SpeechToText({
    onTranscriptionChange,
    isActive,
}: SpeechToTextProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [isSupported, setIsSupported] = useState(false);
    useEffect(() => {
        // Check if Speech Recognition is supported
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;
        setIsSupported(!!SpeechRecognition);
    }, []);

    const startListening = () => {
        if (!isSupported) return;

        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "ar-SA";

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {
            let finalTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            if (finalTranscript) {
                setTranscript(finalTranscript);
                onTranscriptionChange(finalTranscript);
            }
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.start();
    };

    const stopListening = () => {
        setIsListening(false);
    };

    const clearTranscript = () => {
        setTranscript("");
        onTranscriptionChange("");
    };

    if (!isSupported) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center text-gray-500">
                    <MicOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>التعرف على الصوت غير مدعوم في هذا المتصفح</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                    <Volume2 className="h-5 w-5 mr-2 text-blue-600" />
                    التحكم الصوتي
                </h2>
                <div
                    className={`h-3 w-3 rounded-full ${
                        isListening ? "bg-red-500 animate-pulse" : "bg-gray-300"
                    }`}
                ></div>
            </div>

            <div className="space-y-4">
                <div className="flex gap-2">
                    <button
                        onClick={isListening ? stopListening : startListening}
                        disabled={!isActive}
                        className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
                            isListening
                                ? "bg-red-100 text-red-700 hover:bg-red-200"
                                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        } ${!isActive ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        {isListening ? (
                            <>
                                <MicOff className="h-4 w-4 mr-2" />
                                إيقاف التسجيل
                            </>
                        ) : (
                            <>
                                <Mic className="h-4 w-4 mr-2" />
                                بدء التسجيل
                            </>
                        )}
                    </button>

                    <button
                        onClick={clearTranscript}
                        className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        مسح
                    </button>
                </div>

                {transcript && (
                    <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600 mb-2">
                            النص المُسجّل:
                        </p>
                        <p className="text-gray-900 font-medium">
                            {transcript}
                        </p>
                    </div>
                )}

                <div className="text-xs text-gray-500">
                    {isListening
                        ? "يتم الاستماع..."
                        : 'اضغط على "بدء التسجيل" للبدء'}
                </div>
            </div>
        </div>
    );
}
