import React, { useState } from 'react';
import { Sparkles, Settings, Key, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface AIContentGeneratorProps {
  onContentGenerated: (content: string) => void;
}

export const AIContentGenerator: React.FC<AIContentGeneratorProps> = ({
  onContentGenerated
}) => {
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const hasApiKey = !!geminiService.getApiKey();

  const handleGenerateContent = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    if (!hasApiKey) {
      setError('Please configure your Gemini API key first');
      setShowApiKeyInput(true);
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess('');

    try {
      const result = await geminiService.generateContent(prompt);
      
      if (result.success && result.content) {
        onContentGenerated(result.content);
        setSuccess('Content generated successfully!');
        setPrompt('');
        setShowPromptInput(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to generate content');
      }
    } catch (error) {
      setError('Unexpected error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setIsValidatingKey(true);
    setError('');

    try {
      const validation = await geminiService.validateApiKey(apiKey);
      
      if (validation.success) {
        geminiService.setApiKey(apiKey);
        setSuccess('API key saved successfully!');
        setApiKey('');
        setShowApiKeyInput(false);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(validation.error || 'Invalid API key');
      }
    } catch (error) {
      setError('Error validating API key');
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleRemoveApiKey = () => {
    if (confirm('Are you sure you want to remove the API key?')) {
      geminiService.clearApiKey();
      setSuccess('API key removed');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  return (
    <div className="space-y-3">
      {/* AI Generate Button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowPromptInput(!showPromptInput)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
        >
          <Sparkles size={16} />
          Generate with AI
        </button>

        <button
          type="button"
          onClick={() => setShowApiKeyInput(!showApiKeyInput)}
          className={`p-2 rounded-lg transition-colors ${
            hasApiKey 
              ? 'text-green-600 hover:bg-green-50' 
              : 'text-gray-400 hover:bg-gray-50'
          }`}
          title={hasApiKey ? 'API Key Configured' : 'Configure API Key'}
        >
          {hasApiKey ? <CheckCircle size={16} /> : <Key size={16} />}
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg p-2">
          <CheckCircle size={14} />
          {success}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-2">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* API Key Configuration */}
      {showApiKeyInput && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Key size={16} />
              Gemini API Configuration
            </h4>
            <button
              onClick={() => {
                setShowApiKeyInput(false);
                setError('');
                setApiKey('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          {hasApiKey ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle size={14} />
                API key is configured and ready to use
              </div>
              <button
                onClick={handleRemoveApiKey}
                className="text-red-600 hover:text-red-700 text-sm font-medium"
              >
                Remove API Key
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your Gemini API key..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveApiKey}
                  disabled={isValidatingKey || !apiKey.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isValidatingKey ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Save API Key'
                  )}
                </button>
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p>Get your free Gemini API key from:</p>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:underline"
                >
                  Google AI Studio
                </a>
                <p className="text-gray-400">Your API key is stored locally and never shared.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Prompt Input */}
      {showPromptInput && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Sparkles size={16} className="text-purple-600" />
              AI Content Generator
            </h4>
            <button
              onClick={() => {
                setShowPromptInput(false);
                setError('');
                setPrompt('');
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe what you want to post about:
            </label>
            <textarea
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setError('');
              }}
              placeholder="e.g., 'A motivational post about starting a new business', 'Announce our new product launch with excitement', 'Share tips for healthy living'..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
            />
            <div className="mt-1 text-xs text-gray-500">
              Be specific about the tone, topic, and style you want
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleGenerateContent}
              disabled={isGenerating || !prompt.trim() || !hasApiKey}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Generate Content
                </>
              )}
            </button>

            {!hasApiKey && (
              <button
                onClick={() => setShowApiKeyInput(true)}
                className="px-4 py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors text-sm"
              >
                Configure API Key
              </button>
            )}
          </div>

          {/* Example Prompts */}
          <div className="border-t border-purple-200 pt-3">
            <p className="text-xs font-medium text-gray-700 mb-2">Example prompts:</p>
            <div className="space-y-1">
              {[
                "A motivational Monday post for entrepreneurs",
                "Announce our new product with excitement and benefits",
                "Share 3 quick productivity tips for remote workers",
                "Thank customers for their support this year"
              ].map((example, index) => (
                <button
                  key={index}
                  onClick={() => setPrompt(example)}
                  className="block text-xs text-purple-600 hover:text-purple-700 hover:underline text-left"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};