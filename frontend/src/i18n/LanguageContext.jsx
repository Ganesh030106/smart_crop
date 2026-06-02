/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from './translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(
        () => localStorage.getItem('language') || 'en'
    );

    const t = (key) => {
        const lang = translations[language] || translations.en;
        return lang[key] || translations.en[key] || key;
    };

    const changeLanguage = (code) => {
        setLanguage(code);
        localStorage.setItem('language', code);
        // Update html lang attribute
        document.documentElement.lang = code;
    };

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, changeLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
    return ctx;
}
