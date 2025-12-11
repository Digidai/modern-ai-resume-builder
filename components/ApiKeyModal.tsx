import React, { useState } from 'react';
import { Button } from './Button';
import { KeyIcon } from './Icons';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
    const [key, setKey] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (key.trim()) {
            onSave(key.trim());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
                <div className="flex items-center gap-3 mb-4 text-indigo-600">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <KeyIcon className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">Enter API Key</h2>
                </div>

                <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                    To use the AI writing features, you need a Google Gemini API Key.
                    Your key is saved locally in your browser and never sent to our servers.
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Google Gemini API Key</label>
                        <input
                            type="password"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            placeholder="AIza..."
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
                            autoFocus
                        />
                        <div className="mt-2 text-xs text-slate-400">
                            Don't have one? <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Get a free key here →</a>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-2">
                        <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" disabled={!key} className="flex-1">
                            Save Key
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
