
import React from 'react';
import { BackIcon, CloseIcon, UploadIcon } from './Icons';

type Screen = 'upload' | 'editor' | 'settings' | 'privacyPolicy' | 'termsOfService' | 'myPatterns' | 'contact';

interface HeaderProps {
    activeScreen: Screen;
    onNavigate: (screen: Screen) => void;
    onBack: () => void;
    onCloseEditor: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeScreen, onNavigate, onBack, onCloseEditor }) => {
    const isUploadActive = ['upload', 'editor'].includes(activeScreen);
    const showBackButton = ['privacyPolicy', 'termsOfService'].includes(activeScreen);
    const showCloseButton = activeScreen === 'editor';
    
    let title = "Cross-Stitch Pattern Generator";
    // FIX: Use `activeScreen` prop instead of undefined `screen` variable for title logic.
    if (activeScreen === 'editor') title = 'Edit Pattern';
    if (activeScreen === 'settings') title = 'Settings';
    if (activeScreen === 'myPatterns') title = 'My Patterns';
    if (activeScreen === 'privacyPolicy') title = 'Privacy Policy';
    if (activeScreen === 'termsOfService') title = 'Terms of Service';
    if (activeScreen === 'contact') title = 'Contact Us';

    return (
        <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-sm border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Left side: Title and back button */}
                    <div className="flex items-center gap-4">
                         {showBackButton ? (
                            <button onClick={onBack} className="text-slate-500 hover:text-slate-800 md:hidden">
                                <BackIcon />
                            </button>
                        ) : (
                             <button onClick={() => onNavigate('upload')} className="flex items-center gap-2 text-lg font-bold text-slate-800">
                                <div className="bg-sky-500 p-1.5 rounded-lg text-white">
                                    <UploadIcon active={true} className="w-5 h-5" />
                                </div>
                                <span className="hidden sm:inline">Pattern Generator</span>
                            </button>
                        )}
                       
                    </div>

                    {/* Mobile Title */}
                    <div className="absolute left-1/2 -translate-x-1/2 md:hidden">
                        <h1 className="text-lg font-semibold text-slate-800 text-center">{title}</h1>
                    </div>
                    
                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-2">
                        <NavItem label="New Pattern" active={isUploadActive} onClick={() => onNavigate('upload')} />
                        <NavItem label="My Patterns" active={activeScreen === 'myPatterns'} onClick={() => onNavigate('myPatterns')} />
                        <NavItem label="Contact" active={activeScreen === 'contact'} onClick={() => onNavigate('contact')} />
                        <NavItem label="Settings" active={activeScreen === 'settings'} onClick={() => onNavigate('settings')} />
                    </nav>

                    {/* Right side: Close button */}
                    <div className="flex items-center">
                        {showCloseButton && (
                            <button onClick={onCloseEditor} className="text-slate-500 hover:text-slate-800 md:hidden">
                                <CloseIcon />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

const NavItem: React.FC<{ label: string, active?: boolean, onClick: () => void }> = ({ label, active, onClick }) => {
    return (
        <button 
            onClick={onClick}
            className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                active 
                    ? 'bg-sky-100 text-sky-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            }`}
        >
            {label}
        </button>
    )
}

export default Header;