import torch
import torch.nn as nn

class EEGNet(nn.Module):
    def __init__(self, num_channels, num_classes):
        super(EEGNet, self).__init__() # אתחול מחלקת האם של PyTorch
        
        # --- בלוק 1: סינון טמפורלי ומרחבי ---
        # קונבולוציה ראשונית לאורך הזמן כדי לחלץ מאפיינים תדרים
        self.conv1 = nn.Conv2d(1, 8, kernel_size=(1, 64), padding=(0, 32), bias=False)
        # נרמול השכבה כדי לשמור על ערכים יציבים
        self.batchnorm1 = nn.BatchNorm2d(8)
        
        # קונבולוציית עומק (Depthwise) - מנתחת את הקשר המרחבי בין האלקטרודות
        self.depthwise = nn.Conv2d(8, 16, kernel_size=(num_channels, 1), groups=8, bias=False)
        # נרמול נוסף לאחר הניתוח המרחבי
        self.batchnorm2 = nn.BatchNorm2d(16)
        # פונקציית הפעלה לא-ליניארית שמאפשרת למודל ללמוד תבניות מורכבות
        self.elu = nn.ELU()
        # צמצום נתונים (Pooling) להפחתת רזולוציה במימד הזמן
        self.avg_pool1 = nn.AvgPool2d((1, 4))
        # מניעת התאמת יתר (Overfitting) על ידי כיבוי אקראי של נוירונים
        self.dropout1 = nn.Dropout(0.25)
        
        # --- בלוק 2: סיכום טמפורלי ---
        # קונבולוציה נפרדת (Separable) לסיכום המידע שנאסף
        self.separable = nn.Conv2d(16, 16, kernel_size=(1, 16), padding=(0, 8), groups=16, bias=False)
        # נרמול אחרון לפני הכניסה לשכבת הסיווג
        self.batchnorm3 = nn.BatchNorm2d(16)
        # צמצום נוסף של המידע כדי להתרכז במאפיינים העיקריים
        self.avg_pool2 = nn.AvgPool2d((1, 8))
        # מניעת התאמת יתר נוספת
        self.dropout2 = nn.Dropout(0.25)
        
        # --- שכבת סיווג ---
        # הפיכת המטריצה הדו-מימדית לוקטור שטוח (שורה אחת ארוכה)
        self.flatten = nn.Flatten()
        # שכבה לינארית שמחברת את המאפיינים למספר המחלקות (החלטה סופית)
        self.fc = nn.Linear(16 * 7, num_classes) 
        # פונקציה שממירה את הציונים להסתברויות (סכום 100%)
        self.softmax = nn.Softmax(dim=1)

    def forward(self, x):
        # העברת הנתונים דרך בלוק 1
        x = self.conv1(x)
        x = self.batchnorm1(x)
        x = self.depthwise(x)
        x = self.batchnorm2(x)
        x = self.elu(x)
        x = self.avg_pool1(x)
        x = self.dropout1(x)
        
        # העברת הנתונים דרך בלוק 2
        x = self.separable(x)
        x = self.batchnorm3(x)
        x = self.elu(x)
        x = self.avg_pool2(x)
        x = self.dropout2(x)
        
        # סיווג סופי והחזרת התוצאות
        x = self.flatten(x)
        x = self.fc(x)
        return self.softmax(x)