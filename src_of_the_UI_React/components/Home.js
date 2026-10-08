import React from "react";
import { Link } from "react-router-dom";
import "../App.css";

export default function Home() {

  // פונקציה שבודקת מול השרת בפייתון אם הוא עובד
  const checkConnection = async () => {
    try {
      const response = await fetch('http://localhost:5005/status');
      if (response.ok) {
        alert("✅ המערכת מחוברת ותקינה!");
      }
    } catch (error) {
      alert("❌ המערכת לא מגיבה. ודאי שקובץ ה-main.py בפייתון רץ.");
    }
  };

  return (
    <div className="card">
      <h1>מערכת להדמיית כוונת התנועה</h1>
      
      <div style={{ textAlign: 'right', marginBottom: '20px' }}>
        <h2>איך זה עובד?</h2>
        <p>
          1. חובשים את מערכת ה-EEG על הראש.<br />
          2. עורכים כיול ראשוני של האותות המוחיים.<br />
          3. המערכת תזהה את כוונת התנועה (ימינה/שמאלה).<br />
          4. הדמות על המסך תגיב בזמן אמת למחשבה שלך.
        </p>
      </div>

      <div id="bar" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
        {/* כפתור המעבר הרגיל */}
        <Link to="/a" className="btn-primary">התחל בתהליך החיבור</Link>
        
        {/* הכפתור החדש לבדיקה */}
        <button 
          onClick={checkConnection} 
          className="btn-primary" 
          style={{ backgroundColor: '#444', border: 'none', cursor: 'pointer' }}
        >
          🔍 בדיקת חיבורים
        </button>
      </div>
    </div>
  );
}
