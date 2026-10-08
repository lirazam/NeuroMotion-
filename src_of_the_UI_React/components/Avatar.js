import React, { useEffect, useRef, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { SkeletonUtils } from 'three-stdlib'; // מגיע מותקן אוטומטית עם drei

export default function Avatar({ intent }) {
  // טעינת המודל הגולמי מהשרת
  const { scene: rawScene } = useGLTF('/scene.gltf');
  
  // שימוש ב-SkeletonUtils כדי ליצור עותק נקי וייחודי לרינדור הנוכחי
  // זה מונע לחלוטין את הפיכת הרגליים ב-180 מעלות וטעויות זיכרון!
  const scene = useMemo(() => SkeletonUtils.clone(rawScene), [rawScene]);
  
  const bones = useRef({});
  const initialRotations = useRef({});

  useEffect(() => {
    bones.current = {};
    initialRotations.current = {};
    
    // מיפוי וזכירת מצב המוצא המקורי והטבעי של היצרן
    scene.traverse((node) => {
      if (node.isBone) {
        bones.current[node.name] = node;
        initialRotations.current[node.name] = node.rotation.clone();
      }
    });
  }, [scene]);

  useEffect(() => {
    if (!scene) return;

    // רשימת האיברים שאנו מניעים בסימולציה
    const activeBones = [
      'upperarm_R_M_lowpoly001',
      'upperarm_L_M_lowpoly001',
      'thigh_R_M_lowpoly001',
      'thigh_L_M_lowpoly001'
    ];

    // שלב א': החזרה של כל האיברים למצב המקורי המדויק שלהם
    activeBones.forEach((name) => {
      const bone = bones.current[name];
      const initial = initialRotations.current[name];
      if (bone && initial) {
        bone.rotation.copy(initial);
      }
    });

    const rightArm = bones.current['upperarm_R_M_lowpoly001'];
    const leftArm = bones.current['upperarm_L_M_lowpoly001'];
    const rightThigh = bones.current['thigh_R_M_lowpoly001'];
    const leftThigh = bones.current['thigh_L_M_lowpoly001'];

    // שלב ב': ביצוע האנימציה המבוקשת בצורה יחסית ויציבה
    if (intent === 'Right' && rightArm) {
      rightArm.rotation.z = initialRotations.current['upperarm_R_M_lowpoly001'].z - 1.2;
    } 
    else if (intent === 'Left' && leftArm) {
      leftArm.rotation.z = initialRotations.current['upperarm_L_M_lowpoly001'].z + 1.2;
    } 
    else if (intent === 'Legs') {
      // הרמת הירכיים קדימה (אם הכיוון הפוך בדגם שלך, נשנה את המינוס לפלוס)
      if (rightThigh) rightThigh.rotation.x = initialRotations.current['thigh_R_M_lowpoly001'].x - 0.5;
      if (leftThigh) leftThigh.rotation.x = initialRotations.current['thigh_L_M_lowpoly001'].x - 0.5;
    }
  }, [intent, scene]);

  return <primitive object={scene} />;
}