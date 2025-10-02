
import React, { useState } from 'react';
import UploadScreen from './components/UploadScreen';
import EditorScreen from './components/EditorScreen';
import BottomNav from './components/BottomNav';
import SettingsScreen from './components/SettingsScreen';
import PrivacyPolicyScreen from './components/PrivacyPolicyScreen';
import TermsOfServiceScreen from './components/TermsOfServiceScreen';
import MyPatternsScreen from './components/MyPatternsScreen';
import ContactScreen from './components/ContactScreen';
import Header from './components/Header';
import { SavedPattern } from './types';

type Screen = 'upload' | 'editor' | 'settings' | 'privacyPolicy' | 'termsOfService' | 'myPatterns' | 'contact';

const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
};

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [initialEditorState, setInitialEditorState] = useState<SavedPattern | null>(null);
  const [previousScreen, setPreviousScreen] = useState<Screen>('upload');

  const navigateTo = (targetScreen: Screen) => {
    setPreviousScreen(screen);
    setScreen(targetScreen);
  }

  const handleImageUpload = (file: File) => {
    setImageFile(file);
    setInitialEditorState(null);
    navigateTo('editor');
  };
  
  const handleLoadPattern = async (pattern: SavedPattern) => {
    try {
        const file = await dataUrlToFile(pattern.originalImageDataUrl, `saved-pattern-${pattern.id}.png`);
        setImageFile(file);
        setInitialEditorState(pattern);
        navigateTo('editor');
    } catch (error) {
        console.error("Failed to load pattern image", error);
        alert("There was an error loading the saved pattern's image. The file may be corrupted.");
    }
  };

  const handleCloseEditor = () => {
    setImageFile(null);
    setInitialEditorState(null);
    navigateTo('upload');
  };

  const handleBack = () => {
    setScreen(previousScreen);
  }

  const renderScreen = () => {
    switch (screen) {
      case 'upload':
        return <UploadScreen onImageUpload={handleImageUpload} />;
      case 'editor':
        if (imageFile) return <EditorScreen imageFile={imageFile} initialState={initialEditorState} onBack={handleCloseEditor} />;
        return <UploadScreen onImageUpload={handleImageUpload} />; // Fallback
      case 'myPatterns':
        return <MyPatternsScreen onLoadPattern={handleLoadPattern} />;
      case 'settings':
        return <SettingsScreen onNavigate={navigateTo} />;
      case 'privacyPolicy':
        return <PrivacyPolicyScreen />;
      case 'termsOfService':
        return <TermsOfServiceScreen />;
      case 'contact':
        return <ContactScreen />;
      default:
        return <UploadScreen onImageUpload={handleImageUpload} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans antialiased text-slate-800">
      <Header 
        activeScreen={screen} 
        onNavigate={navigateTo} 
        onBack={handleBack} 
        onCloseEditor={handleCloseEditor} 
      />
      <main className="flex-grow w-full max-w-7xl mx-auto p-4 md:p-8">
        {renderScreen()}
      </main>
      <div className="md:hidden">
         <BottomNav activeScreen={screen} onNavigate={navigateTo} />
      </div>
    </div>
  );
};

export default App;
