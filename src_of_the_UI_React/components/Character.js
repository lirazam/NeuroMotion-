import { motion } from 'framer-motion';

export default function Character({ movement }) {
  // הגדרת האנימציה - "סגנון מודרני וחלק"
  const armVariants = {
    Idle: { rotate: 0 },
    Right: { rotate: 45, transition: { type: "spring", stiffness: 100 } },
    Left: { rotate: -45, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <div className="character-container">
      <svg width="200" height="200">
        {/* הגוף */}
        <circle cx="100" cy="50" r="30" fill="#3b82f6" />
        {/* היד שזזה */}
        <motion.line 
          x1="100" y1="80" x2="100" y2="150" 
          stroke="#3b82f6" strokeWidth="10"
          animate={movement}
          variants={armVariants}
        />
      </svg>
    </div>
  );
}