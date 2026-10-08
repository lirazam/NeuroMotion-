import torch
from EEGNet import EEGNet # יבוא הקוד שרשמנו במחלקת EEGNet.py

# 1. הגדרות בסיסיות של המכשיר
NUM_CHANNELS = 16
NUM_SAMPLES = 250
NUM_CLASSES = 5#מצבים של: 1. מנוחה 2. תנועה של יד ימין 3. תנועה של יד שמאל 4. תנועה של רגל ימין 5. תנועה של רגל שמאל

# 2. יצירת המודל
model = EEGNet(num_channels=NUM_CHANNELS, num_classes=NUM_CLASSES)

# 3. סימולציה של נתונים (כאילו קיבלנו אותם מהאלקטרודות)
# המבנה הוא: [Batch_Size, Channels, Samples] -> [1, 16, 250]
dummy_data = torch.randn(1, 1, NUM_CHANNELS, NUM_SAMPLES)

# 4. הרצת המודל על הנתונים
model.eval() # מצב בדיקה  לפני הרצה
with torch.no_grad(): # אנחנו לא צריכים ללמוד עכשיו, רק להריץ
    output = model(dummy_data)

print("התוצאה שחזרה מהמודל:", output)
print("צורה של הנתונים אחרי הסיווג:", output.shape)