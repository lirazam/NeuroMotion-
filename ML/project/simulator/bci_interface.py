import sys
import socket
from PyQt5.QtWidgets import QApplication, QWidget, QVBoxLayout, QPushButton, QLabel
from PyQt5.QtCore import Qt

class BCIMenu(QWidget):
    def __init__(self):
        super().__init__()
        
        # הגדרות כלליות לחלון
        self.setWindowTitle("BCI Control Center")
        self.setGeometry(100, 100, 400, 500)
        self.setStyleSheet("background-color: #0d0d2b;") # רקע כחול כהה עמוק
        
        # הגדרות תקשורת (UDP)
        # ודאי שה-IP מתאים לכתובת ה-IP של ה-ESP32 ברשת שלך
        self.udp_ip = "192.168.137.1" 
        self.udp_port = 12345
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        
        # יצירת הממשק
        layout = QVBoxLayout()
        
        title = QLabel("Select Motor Task")
        title.setStyleSheet("color: #00e5ff; font-size: 24px; font-weight: bold; margin-bottom: 20px;")
        title.setAlignment(Qt.AlignCenter)
        layout.addWidget(title)
        
        # יצירת 4 הכפתורים (טקסט, קוד פקודה)
        self.create_button(layout, "Right Hand", "1")
        self.create_button(layout, "Left Hand", "2")
        self.create_button(layout, "Legs", "3")
        self.create_button(layout, "Tongue", "4")
        
        self.setLayout(layout)

    def create_button(self, layout, text, command):
        btn = QPushButton(text)
        # עיצוב ניאון
        btn.setStyleSheet("""
            QPushButton {
                background-color: #1a1a4a;
                color: #00e5ff;
                border: 2px solid #8e44ad;
                border-radius: 15px;
                padding: 20px;
                font-size: 18px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #2c2c6e;
                border: 2px solid #00e5ff;
            }
            QPushButton:pressed {
                background-color: #8e44ad;
                color: white;
            }
        """)
        
        # חיבור הכפתור לפונקציה
        btn.clicked.connect(lambda checked, t=text, c=command: self.send_command(t, c))
        layout.addWidget(btn)

    def send_command(self, label, cmd):
        # שליחת הפקודה ב-UDP
        try:
            self.sock.sendto(cmd.encode(), (self.udp_ip, self.udp_port))
            # הדפסת התווית כפי שביקשת
            print(f" נשלחה פקודה: {label} | קוד שנשלח ב-UDP: {cmd}")
        except Exception as e:
            print(f" שגיאה בשליחת פקודה: {e}")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = BCIMenu()
    window.show()
    sys.exit(app.exec_())