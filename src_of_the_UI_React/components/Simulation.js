import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Avatar from './Avatar'; 

export default function Simulation({ language, isDevMode, isDarkMode }) {
  const [intent, setIntent] = useState('REST');
  const [status, setStatus] = useState('Disconnected'); 
  const [hasReceivedData, setHasReceivedData] = useState(false); 
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false); 

  const addLog = (message) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prevLogs) => [`[${timestamp}] ${message}`, ...prevLogs].slice(0, 50));
  };

  // איפוס מוחלט במעבר בין מצב מפתח למשתמש
  useEffect(() => {
    if (!isDevMode) {
      setIntent('REST');
      setHasReceivedData(false);
      addLog("🔄 חזרה למצב משתמש: המערכת אופסה ומחפשת אותות פייתון בלבד.");
    }
  }, [isDevMode]);

  // חיבור ל-WebSocket והאזנה ללייבלים של הפייתון
  useEffect(() => {
    addLog("🔌 מתחבר לשרת ה-WebSocket בפורט 12345...");
    const ws = new WebSocket('ws://localhost:12345');

    ws.onopen = () => {
      setStatus('Connected');
      addLog("🟢 החיבור לפייתון הצליח! מחפש אותות עצביים...");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data && data.command) {
          const rawCommand = data.command; 

          // 🧠 מפת סינכרון מעודכנת - תומכת כעת ב-tongue בצורה תקנית
          const labelsMapping = {
            'rest': 'REST',
            'right hand': 'Right',
            'left hand': 'Left',
            'legs': 'Legs',
            'tongue': 'Tongue', 
            'toung': 'Tongue'   // גיבוי למקרה שהפייתון הישן עדיין רץ
          };

          const mappedIntent = labelsMapping[rawCommand] || 'REST';

          setIntent(mappedIntent);
          setHasReceivedData(true); 
          addLog(`🧠 אות מזוהה: "${rawCommand}" -> הופעל: "${mappedIntent}"`);
        }
      } catch (error) {
        addLog("⚠️ שגיאה בפענוח הנתונים מהשרת");
      }
    };

    ws.onerror = () => {
      setStatus('Disconnected');
      addLog("⚠️ שרת הפייתון אינו זמין בפורט 12345");
    };

    ws.onclose = () => {
      setStatus('Disconnected');
      setHasReceivedData(false); 
      addLog("🔴 החיבור לפייתון נסגר.");
    };

    return () => ws.close();
  }, []);

  const simTexts = {
    he: {
      rightArm: 'יד ימין 🛑',
      leftArm: 'יד שמאל 🛑',
      legs: 'רגליים 🛑',
      tongue: 'לשון 👅', 
      rest: 'מנוחה (אפס תנוחה)', 
      statusConnected: '● המערכת מחוברת לפייתון',
      statusDisconnected: '○ ממתין לחיבור מהמכשיר...',
      currentIntent: 'כוונה מזוהה מהמוח:',
      toggleLogs: '📋 יומן לוגים',
      logTitle: '💻 יומן מערכת (Developer Logs)',
      searching: 'מחפש חיבורים וממתין לאותות מהמכשיר...'
    },
    en: {
      rightArm: 'Right Arm 🛑',
      leftArm: 'Left Arm 🛑',
      legs: 'Legs 🛑',
      tongue: 'Tongue 👅',
      rest: 'Rest (Reset)', 
      statusConnected: '● Connected to Python',
      statusDisconnected: '○ Waiting for Python connection...',
      currentIntent: 'Neural Intent:',
      toggleLogs: '📋 Toggle Logs',
      logTitle: '💻 Real-time System Logs',
      searching: 'Searching for connections and waiting for neural data...'
    }
  }[language || 'he'];

  const btnStyle = { 
    padding: '10px 20px', margin: '5px', cursor: 'pointer', fontSize: '0.95rem',
    background: '#38bdf8', color: '#fff', border: 'none', borderRadius: '8px',
    fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.15)', zIndex: 20
  };

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'flex-start', 
      alignItems: 'center',     
      overflow: 'hidden', 
      direction: language === 'he' ? 'rtl' : 'ltr', 
      paddingTop: '40px',
      boxSizing: 'border-box'
    }}>
      
      {/* אזור הסטטוס המרכזי */}
      <div style={{ textAlign: 'center', marginBottom: '20px', zIndex: 10, width: '100%' }}>
        <div style={{ color: status === 'Connected' ? '#10b981' : '#ef4444', fontSize: '1.2rem', fontWeight: 'bold' }}>
          {status === 'Connected' ? simTexts.statusConnected : simTexts.statusDisconnected}
        </div>
        
        {(hasReceivedData || isDevMode) && (
          <h2 style={{ color: isDarkMode ? '#38bdf8' : '#1e3a8a', marginTop: '10px', fontSize: '2.2rem' }}>
            {simTexts.currentIntent} <span style={{ fontWeight: '900', textDecoration: 'underline' }}>{intent}</span>
          </h2>
        )}
      </div>

      {/* כפתורי שליטה למפתח */}
      {isDevMode && (
        <div style={{ padding: '10px', textAlign: 'center', zIndex: 10, width: '100%' }}>
          <button style={btnStyle} onClick={() => { setIntent('Right'); addLog('🔧 מעקף: פקודת יד ימין הופעלה'); }}>{simTexts.rightArm}</button>
          <button style={btnStyle} onClick={() => { setIntent('Left'); addLog('🔧 מעקף: פקודת יד שמאל הופעלה'); }}>{simTexts.leftArm}</button>
          <button style={btnStyle} onClick={() => { setIntent('Legs'); addLog('🔧 מעקף: פקודת רגליים הופעלה'); }}>{simTexts.legs}</button>
          <button style={{ ...btnStyle, background: '#a855f7' }} onClick={() => { setIntent('Tongue'); addLog('🔧 מעקף: פקודת לשון הופעלה'); }}>{simTexts.tongue}</button> 
          <button style={{ ...btnStyle, background: '#ef4444' }} onClick={() => { setIntent('REST'); addLog('🔧 מעקף: המערכת אופסה'); }}>{simTexts.rest}</button>
          <button style={{ ...btnStyle, background: '#1e293b', border: '1px solid #475569' }} onClick={() => setShowLogs(!showLogs)}>
            {simTexts.toggleLogs}
          </button>
        </div>
      )}

      {/* יומן לוגים צף */}
      {isDevMode && showLogs && (
        <div style={{
          position: 'fixed', bottom: '20px', right: language === 'he' ? '20px' : 'auto', left: language === 'en' ? '20px' : 'auto',
          width: '400px', height: '220px', background: 'rgba(15, 23, 42, 0.95)', border: '2px solid #334155',
          borderRadius: '12px', padding: '12px', zIndex: 200, boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column', textAlign: 'left', direction: 'ltr'
        }}>
          <div style={{ color: '#38bdf8', fontWeight: 'bold', borderBottom: '1px solid #334155', paddingBottom: '5px', fontSize: '0.85rem' }}>
            {simTexts.logTitle}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', marginTop: '8px', fontFamily: 'monospace', fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column-reverse' }}>
            {logs.map((log, index) => (
              <div key={index} style={{ marginBottom: '4px', whiteSpace: 'pre-wrap', color: log.includes('🟢') ? '#10b981' : log.includes('🔴') || log.includes('⚠️') ? '#f43f5e' : '#cbd5e1' }}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ניהול תצוגה דינמי וממורכז לחלוטין */}
      {!isDevMode && !hasReceivedData ? (
        /* 1. מסך החיפוש ההתחלתי במצב משתמש */
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',  
          alignItems: 'center',      
          width: '100%',
          marginTop: '-40px'         
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '6px solid #e2e8f0',
            borderTop: '6px solid #38bdf8',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '25px'
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{ color: isDarkMode ? '#cbd5e1' : '#1e3a8a', fontSize: '1.3rem', fontWeight: '600', textAlign: 'center' }}>
            {simTexts.searching}
          </p>
        </div>
      ) : (
        /* 2. האוואטר התלת-מימדי */
        <div style={{ width: '100%', height: '70vh', position: 'relative', touchAction: 'none' }}>
          <Canvas camera={{ position: [0, 0, 2.8], fov: 45 }}>
            <ambientLight intensity={isDarkMode ? 0.7 : 1.5} color={isDarkMode ? '#bfdbfe' : '#ffffff'} />
            <directionalLight position={[5, 10, 5]} intensity={isDarkMode ? 0.8 : 1.4} color="#ffffff" />
            <directionalLight position={[-5, 5, -5]} intensity={isDarkMode ? 0.3 : 0.6} />
            
            {intent === 'Tongue' && (
              <pointLight position={[0, 0.55, 0.35]} intensity={35} color="#ff0000" distance={0.65} decay={2} />
            )}
            
            <Suspense fallback={null}>
              <group position={[0, -0.8, 0]}>
                <Avatar intent={intent} />
              </group>
            </Suspense>
            
            <OrbitControls enableZoom={true} target={[0, 0, 0]} makeDefault />
          </Canvas>
        </div>
      )}
    </div>
  );
}