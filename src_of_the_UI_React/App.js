import A, { A1, A2 } from "./components/A";
import B from "./components/B";
import C from "./components/C";
import D from "./components/D";
import E from "./components/E";
import F from "./components/F";
import Home from "./components/Home";
import Simulation from "./components/Simulation";
// הוספנו את useLocation כדי לזהות את העמוד הנוכחי
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom"; 
import './App.css';
import React, { useState } from 'react'; 

function App() {
  let navigate = useNavigate();
  let location = useLocation(); // מאפשר לדעת באיזה נתיב (Route) אנחנו נמצאים

  // מצבי מערכת גלובליים
  const [lang, setLang] = useState('he');
  const [isDevMode, setIsDevMode] = useState(false);
  const [logoClicks, setLogoClicks] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true); // ☀️/🌙 מצב תאורה גלובלי לכל האתר

  // תרגום עבור הכפתורים הגלובליים למעלה
  const globalTexts = {
    he: {
      home: '🏠 דף הבית',
      dayMode: '☀️ מצב יום',
      nightMode: '🌙 מצב לילה'
    },
    en: {
      home: '🏠 Home',
      dayMode: '☀️ Day Mode',
      nightMode: '🌙 Night Mode'
    }
  }[lang];

  // פונקציית הלחיצות הסודית על הלוגו (3 לחיצות עם קוד 12345678 בשני הכיוונים)
  const handleLogoClick = () => {
    const nextClicks = logoClicks + 1;
    
    if (nextClicks === 3) {
      setLogoClicks(0); // איפוס מונה
      
      if (isDevMode) {
        const code = prompt(lang === 'he' ? 'אנא הכנס קוד כדי לחזור למצב משתמש:' : 'Please enter code to return to user mode:');
        if (code === '12345678') {
          setIsDevMode(false);
          alert(lang === 'he' ? '🔓 חזרת למצב משתמש רגיל! הכפתורים הוסתרו.' : '🔓 Returned to regular user mode!');
        } else {
          alert(lang === 'he' ? '❌ קוד שגוי! נשארת במצב מפתח.' : '❌ Incorrect code! Remaining in developer mode.');
        }
      } else {
        const code = prompt(lang === 'he' ? 'אנא הכנס קוד מפתח:' : 'Please enter developer code:');
        if (code === '12345678') {
          setIsDevMode(true);
          alert(lang === 'he' ? '🛠️ מצב מפתח הופעל בהצלחה! הכפתורים זמינים בסימולציה.' : '🛠️ Developer mode activated!');
        } else {
          alert(lang === 'he' ? '❌ קוד שגוי!' : '❌ Incorrect code!');
        }
      }
    } else {
      setLogoClicks(nextClicks);
    }
  };

  const btnStyle = { 
    padding: '10px 20px', 
    cursor: 'pointer', 
    fontSize: '0.95rem',
    background: '#38bdf8',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold',
    boxShadow: '0 4px 6px rgba(0,0,0,0.15)',
    transition: 'all 0.2s ease'
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      // 🌟 הרקע של כל האתר משתנה פה: כהה בלילה, ותכלת בהיר מהמם ביום!
      background: isDarkMode ? '#0f172a' : '#e0f2fe',
      transition: 'all 0.3s ease',
      overflow: 'auto',
      position: 'relative'
    }}>
      
      {/* 🌟 הלוגו הגלובלי - לחיץ (3 לחיצות) */}
      <img 
        src="/logo.png" 
        alt="Logo" 
        onClick={handleLogoClick}
        style={{ 
          position: 'fixed', 
          top: '15px', 
          left: '20px', 
          height: '50px', 
          objectFit: 'contain',
          zIndex: 150, 
          cursor: 'pointer', 
          userSelect: 'none' 
        }} 
      />

      {/* 🌟 סרגל כפתורים גלובלי בצד ימין למעלה - יופיע בכל המסכים */}
      <div style={{
        position: 'fixed',
        top: '15px',
        right: '20px',
        display: 'flex',
        gap: '12px',
        zIndex: 150,
        direction: lang === 'he' ? 'rtl' : 'ltr'
      }}>
        {/* כפתור הבית יוצג רק אם אנחנו *לא* בדף הבית המרכזי */}
        {location.pathname !== '/' && (
          <button style={{ ...btnStyle, background: '#64748b' }} onClick={() => navigate('/')}>
            {globalTexts.home}
          </button>
        )}
        
        {/* כפתור החלפת תאורה - מופיע תמיד ובכל עמוד */}
        <button 
          style={{ ...btnStyle, background: isDarkMode ? '#f59e0b' : '#0284c7' }} 
          onClick={() => setIsDarkMode(!isDarkMode)}
        >
          {isDarkMode ? globalTexts.dayMode : globalTexts.nightMode}
        </button>
      </div>

      <Routes>
        {/* מעבירים לעמוד הבית את הנתונים הדרושים */}
        <Route index element={<Home language={lang} setLanguage={setLang} isDarkMode={isDarkMode} />} />
        
        <Route path="a">
          <Route index element={<A />} />
          <Route path="a1" element={<A1 />} />
          <Route path="a2" element={<A2 />} />
        </Route>
        
        <Route path="b" element={<B />} />
        <Route path="c" element={<C />} />
        <Route path="d" element={<D />} />
        <Route path="e" element={<E />} />
        <Route path="f" element={<F />} />
        
        {/* מעבירים לסימולציה את השפה, מצב מפתח, ואת מצב התאורה הגלובלי שהגדרנו */}
        <Route path="simulation" element={
          <Simulation 
            language={lang} 
            onBackToHome={() => navigate('/')} 
            isDevMode={isDevMode} 
            isDarkMode={isDarkMode}
          />
        } />
      </Routes>
    </div>
  );
}

export default App;