
import { Routes, Route } from "react-router-dom";
import Home from "./Home";


import React, { useState, useRef, useEffect } from 'react';
import { UserMode, ChatState, Message, Attachment, THEME_CONFIG, UserProfile, ThemeType } from './types';
import { queryBackendAPI } from './services/api'; // UPDATED IMPORT
import { saveUserProfile } from './data/userDatabase';
import { RegistrationForm } from './components/RegistrationForm';
import { 
  Stethoscope, 
  Activity, 
  Send, 
  ImagePlus, 
  Mic, 
  X, 
  Menu,
  ShieldCheck,
  User,
  Database,
  Sun,
  Moon
} from './components/Icons';
import { ChatBubble } from './components/ChatBubble';
import { DisclaimerBanner } from './components/DisclaimerBanner';

export default function App() {

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Chat State
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    mode: UserMode.GENERAL,
    input: '',
    attachment: null,
    theme: 'light' // Default theme
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current theme config
  const currentTheme = THEME_CONFIG[state.theme];

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.messages, state.isLoading]);

  // Apply dark mode class to body for global consistency
  useEffect(() => {
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.theme]);

  // Handle Registration Completion
  const handleRegistrationComplete = async (profile: UserProfile) => {
    // Save to DB (Local + Backend Sync)
    await saveUserProfile(profile);
    setUserProfile(profile);
    
    // Set initial system message
    setState(prev => ({
      ...prev,
      mode: profile.mode,
      messages: [{
        id: '1',
        role: 'system',
        content: `**Consultation Started**\nPatient: ${profile.name} (${profile.age}, ${profile.gender})\nMode: ${profile.mode === UserMode.GENERAL ? 'General Public' : 'Medical Expert'}`,
        timestamp: Date.now()
      }, {
        id: '2',
        role: 'model',
        content: `Hello ${profile.name}. I am ready to assist you in **${profile.mode === UserMode.GENERAL ? 'General' : 'Expert'} Mode**. \n\nPlease describe your symptoms or upload a report.`,
        timestamp: Date.now()
      }]
    }));
  };

  const handleSendMessage = async () => {
    if ((!state.input.trim() && !state.attachment) || state.isLoading) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: state.input,
      timestamp: Date.now(),
      attachments: state.attachment ? [state.attachment] : undefined
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newUserMessage],
      isLoading: true,
      input: '',
      attachment: null
    }));

    try {
      // UPDATED: Call Backend API
      const aiResponseText = await queryBackendAPI(
        newUserMessage.content,
        state.mode,
        newUserMessage.attachments ? newUserMessage.attachments[0] : null,
        userProfile
      );

      const newAiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: aiResponseText,
        timestamp: Date.now()
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, newAiMessage],
        isLoading: false
      }));

    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "Error: Could not reach the medical server.",
        timestamp: Date.now(),
        isError: true
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isLoading: false
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      
      const newAttachment: Attachment = {
        type: 'image',
        url: base64String, 
        base64: base64Data, 
        mimeType: file.type
      };
      
      setState(prev => ({ ...prev, attachment: newAttachment }));
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleTheme = () => {
    setState(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const toggleMode = (newMode: UserMode) => {
    setState(prev => ({ ...prev, mode: newMode }));
    setSidebarOpen(false); 
  };
  const [showHome, setShowHome] = useState(true);

  if (showHome) {
  return <Home onStart={() => setShowHome(false)} />;
  }


  if (!userProfile) {
    return <RegistrationForm onComplete={handleRegistrationComplete} />;
  }
  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${currentTheme.appBg} ${currentTheme.textPrimary}`}>
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 flex flex-col
        ${currentTheme.sidebar}
      `}>
        <div className="p-6 border-b border-inherit flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20`}>
              <Stethoscope size={22} />
            </div>
            <h1 className={`text-xl font-bold tracking-tight`}>ChatDoctor</h1>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 p-5 space-y-8 overflow-y-auto">
          {/* User Profile Card */}
          <div className={`p-4 rounded-2xl border flex items-center space-x-4 ${state.theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/50 border-slate-700'}`}>
             <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${state.theme === 'light' ? 'bg-white text-slate-600 shadow-sm' : 'bg-slate-700 text-slate-300'}`}>
               {userProfile.name.charAt(0)}
             </div>
             <div className="flex-1 min-w-0">
               <div className={`text-sm font-bold truncate`}>{userProfile.name}</div>
               <div className={`text-xs ${currentTheme.textSecondary}`}>{userProfile.age} • {userProfile.gender}</div>
             </div>
          </div>

          {/* Mode Selector */}
          <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${currentTheme.textSecondary}`}>Interface Mode</h3>
            <div className="space-y-3">
              <button 
                onClick={() => toggleMode(UserMode.GENERAL)}
                className={`w-full flex items-center p-3.5 rounded-xl transition-all border ${
                  state.mode === UserMode.GENERAL 
                  ? currentTheme.badge.general + ' shadow-sm'
                  : 'border-transparent hover:bg-black/5 ' + currentTheme.textSecondary
                }`}
              >
                <User size={20} className="mr-3 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-sm">General Public</div>
                  <div className="text-[10px] opacity-70">Simple explanations</div>
                </div>
              </button>

              <button 
                onClick={() => toggleMode(UserMode.EXPERT)}
                className={`w-full flex items-center p-3.5 rounded-xl transition-all border ${
                  state.mode === UserMode.EXPERT 
                  ? currentTheme.badge.expert + ' shadow-sm'
                  : 'border-transparent hover:bg-black/5 ' + currentTheme.textSecondary
                }`}
              >
                <Activity size={20} className="mr-3 shrink-0" />
                <div className="text-left">
                  <div className="font-bold text-sm">Medical Expert</div>
                  <div className="text-[10px] opacity-70">Clinical precision</div>
                </div>
              </button>
            </div>
          </div>
          
           {/* Theme Toggle */}
           <div>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${currentTheme.textSecondary}`}>Appearance</h3>
            <button 
              onClick={toggleTheme}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all border ${state.theme === 'light' ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'}`}
            >
              <div className="flex items-center">
                {state.theme === 'light' ? <Sun size={20} className="mr-3 text-amber-500" /> : <Moon size={20} className="mr-3 text-violet-400" />}
                <span className="font-semibold text-sm">{state.theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${state.theme === 'light' ? 'bg-slate-200' : 'bg-indigo-600'}`}>
                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${state.theme === 'light' ? 'left-1' : 'left-6'}`}></div>
              </div>
            </button>
          </div>

          <div className={`p-4 rounded-xl border ${state.theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-800/30 border-slate-700'}`}>
            <h3 className={`text-xs font-bold mb-3 ${currentTheme.textSecondary}`}>System Status</h3>
            <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-500">
               <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Server Connected</span>
            </div>
            <div className={`mt-2 text-[10px] ${currentTheme.textSecondary}`}>
              Backend: Port 5000<br/>
              Data: Encrypted Stream
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative bg-pattern">
        
        {/* Mobile Header */}
        <header className={`h-16 border-b flex items-center justify-between px-4 md:hidden backdrop-blur-md ${state.theme === 'light' ? 'bg-white/80 border-slate-200' : 'bg-slate-900/80 border-slate-800'}`}>
          <div className="flex items-center">
             <button onClick={() => setSidebarOpen(true)} className={`p-2 -ml-2 ${currentTheme.textSecondary}`}>
              <Menu size={24} />
            </button>
            <span className={`ml-2 text-sm font-bold px-3 py-1 rounded-full ${state.mode === UserMode.GENERAL ? currentTheme.badge.general : currentTheme.badge.expert}`}>
              {state.mode === UserMode.GENERAL ? 'Patient Mode' : 'Doctor Mode'}
            </span>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-4xl mx-auto min-h-full flex flex-col justify-end">
            {state.messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} mode={state.mode} theme={state.theme} />
            ))}
            
            {state.isLoading && (
              <div className="flex justify-start w-full animate-message mb-6">
                 <div className={`flex items-center space-x-2 px-5 py-4 rounded-2xl rounded-tl-none shadow-sm border ${state.theme === 'light' ? 'bg-white border-slate-100' : 'bg-slate-800 border-slate-700'}`}>
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-teal-500 animate-bounce delay-150"></div>
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className={`p-4 md:p-6 relative z-20 ${currentTheme.inputArea}`}>
          
          {/* Attachment Preview */}
          {state.attachment && (
            <div className={`absolute bottom-full left-6 mb-4 p-2 rounded-xl shadow-xl border flex items-start animate-message ${state.theme === 'light' ? 'bg-white border-slate-100' : 'bg-slate-800 border-slate-700'}`}>
              <img src={state.attachment.url} alt="Preview" className="h-24 w-24 object-cover rounded-lg" />
              <button 
                onClick={() => setState(prev => ({...prev, attachment: null}))}
                className="ml-2 bg-slate-100 rounded-full p-1 hover:bg-slate-200 text-slate-500"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <div className="max-w-4xl mx-auto">
            <div className={`
              flex items-end p-2 rounded-3xl shadow-lg border transition-all duration-300
              ${state.theme === 'light' ? 'bg-white border-slate-200 shadow-slate-200/50' : 'bg-slate-800 border-slate-700 shadow-black/20'}
            `}>
             

              {/* Text Input */}
              <div className="flex-1 mx-2 mb-1">
                <textarea
                  value={state.input}
                  onChange={(e) => setState(prev => ({...prev, input: e.target.value}))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder={state.mode === UserMode.GENERAL ? "Describe your symptoms..." : "Enter clinical presentation..."}
                  className={`w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 py-2.5 scrollbar-hide text-base ${state.theme === 'light' ? 'text-slate-800 placeholder:text-slate-400' : 'text-slate-200 placeholder:text-slate-500'}`}
                  rows={1}
                  style={{ minHeight: '44px' }}
                />
              </div>

              

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={(!state.input.trim() && !state.attachment) || state.isLoading}
                className={`
                  p-3 rounded-2xl text-white shadow-md transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 shrink-0
                  ${state.mode === UserMode.GENERAL ? 'bg-gradient-to-r from-teal-500 to-emerald-600' : 'bg-gradient-to-r from-indigo-600 to-violet-600'}
                `}
              >
                <Send size={22} className={(!state.input.trim() && !state.attachment) ? 'ml-0.5' : 'ml-1'} />
              </button>
            </div>
            
            {/* Disclaimer */}
            <div className="mt-4">
               <DisclaimerBanner />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}