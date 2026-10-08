import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// import io from "socket.io-client"; 
import "../App.css";

export default function A() {
  return (
    <div className="card">
      <h1>ברוך הבא!</h1>
      <div className="button-group">
        <h2>להתחלת הבדיקה לחץ</h2>
        <Link to={"/a/a1"} className="btn-primary">לבדיקה</Link>
        
        <h2>להוראות השימוש במכשיר לחץ:</h2>
        <Link to={"/a/a2"} className="btn-secondary">להוראות</Link>
      </div>
    </div>
  );
}

export function A1() {
  const navigate = useNavigate();

  useEffect(() => {
    
   
    // המערכת מבצעת בדיקה של שנייה אחת, ותעביר אותך ישר לסימולציה עם האווטאר
    const timer = setTimeout(() => {
      console.log("עוקף את שרת הפייתון - מעביר לסימולציה לבדיקת כפתורים");
      navigate('/simulation');
    }, 1000); // 1000 מילישניות = שנייה אחת

    return () => clearTimeout(timer); // ניקוי טיימר במידה ויוצאים מהמסך
  }, [navigate]);

  return (
   <div className="card">
      <h1>מתבצעת בדיקת חיבורים</h1>
      <div className="loader-container">
        <div className="spinner"></div>
        <p>מצב פיתוח: עוקף פייתון ומחבר אותך לדמות...</p>
      </div>
    </div>
  );
}

export function A2() {
  let navigate = useNavigate();
  return (
    <div className="card instruction-card">
      <h1>הוראות שימוש במכשיר</h1>
      <div className="instructions-text">
        <p>1. יש לחבר את רצועת ה-EEG לראשך בצורה נוחה ויציבה.</p>
        <p>2. המערכת תבצע כיול אוטומטי של מספר שניות.</p>
        <p>3. תוכל לשלוט בדמות על ידי דמיון תנועות (יד ימין/יד שמאל/רגליים/לשון).</p>
        <p>4. נסה להישאר רגוע וממוקד לדיוק מקסימלי.</p>
      </div>
      <button className="btn-back" onClick={() => navigate(-1)}>חזור ➡️</button>
    </div>
  );
}