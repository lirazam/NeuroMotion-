import sys
import threading
import socket
import struct #לפירוק בינארי של האותות
import numpy as np
import torch
import torch.nn as nn
from pyqtgraph.Qt import QtWidgets, QtCore
import pyqtgraph as pg
import asyncio
import websockets
import json

# ==========================================
# 1. הגדרת המודל (Universal Model)
# ==========================================
class EEGNet_Custom(nn.Module):
    def __init__(self, num_channels=16, num_classes=4):
        super(EEGNet_Custom, self).__init__()  
        self.conv_temporal = nn.Conv2d(1, 16, (1, 64), padding=(0, 32), bias=False)
        self.bn1 = nn.BatchNorm2d(16)
        self.conv_spatial = nn.Conv2d(16, 32, (num_channels, 1), groups=16, bias=False)
        self.bn2 = nn.BatchNorm2d(32)
        self.elu = nn.ELU()
        self.pool1 = nn.AvgPool2d((1, 4))
        self.dropout1 = nn.Dropout(0.25)
        
        self.conv_sep_dw = nn.Conv2d(32, 32, (1, 16), padding=(0, 8), groups=32, bias=False)
        self.conv_sep_pw = nn.Conv2d(32, 32, kernel_size=(1, 1), bias=False) 
        self.bn3 = nn.BatchNorm2d(32) 
        self.pool2 = nn.AvgPool2d((1, 4))
        self.dropout2 = nn.Dropout(0.25)
        
        self.flatten = nn.Flatten()
        self.fc = nn.Linear(32 * 31, num_classes) 

    def forward(self, x):
        x = self.bn1(self.conv_temporal(x))
        x = self.elu(self.bn2(self.conv_spatial(x)))
        x = self.pool1(x)
        x = self.dropout1(x)
        x = self.conv_sep_dw(x)
        x = self.conv_sep_pw(x)
        x = self.elu(self.bn3(x))
        x = self.pool2(x)
        x = self.dropout2(x)
        x = self.flatten(x)
        return self.fc(x)

# ==========================================
# 2. טעינת הנתונים, המסננים והמשקולות
# ==========================================
device = torch.device("cpu")
model = EEGNet_Custom(num_channels=16, num_classes=4).to(device)
model.load_state_dict(torch.load('best_model.pt', map_location=device)) 
model.eval()

#טעינת הקבצים של הפילטר, הממוצע נככלי וסטית התקן
spatial_filter = np.load('spatial_filter.npy') 
mean_val = np.load('global_mean.npy').reshape(16, 1) 
std_val = np.load('global_std.npy').reshape(16, 1)   

BUFFER_SIZE = 500 
data_buffer = np.zeros((16, BUFFER_SIZE)) 
data_history = [[] for _ in range(16)] 

latest_prediction = "rest"

# קבועי בטיחות לדיבאג
CONFIDENCE_THRESHOLD = 0.0  # הורדה ל-0 כדי לראות את כל הניחושים הגולמיים של המודל

# ==========================================
# 3. ממשק גרפי (PyQtGraph) לביקורת האות
# ==========================================
app_qt = QtWidgets.QApplication(sys.argv)
win = pg.GraphicsLayoutWidget(title="Real-time BCI - Universal Model")
win.resize(1000, 600)
plot = win.addPlot(title="Cleaned & Normalized EEG Stream")
curves = [plot.plot(pen=pg.mkPen(color=pg.intColor(i), width=1.5)) for i in range(16)]

def update_ui():
    for i in range(16):
        if len(data_history[i]) > 200:
            curves[i].setData(data_history[i][-200:])

timer = QtCore.QTimer()
timer.timeout.connect(update_ui)
timer.start(50)
win.show()

# ==========================================
# 4. שרת WebSocket לשידור ישיר ל-React (פורט 12345)
# ==========================================
async def ws_handler(websocket):
    print(" React Client Connected!")
    try:
        while True:
            payload = json.dumps({"command": latest_prediction})
            await websocket.send(payload)
            await asyncio.sleep(0.1)
    except websockets.exceptions.ConnectionClosed:
        print("❌ React Client Disconnected")

async def main_ws():
    async with websockets.serve(ws_handler, "localhost", 12345):
        await asyncio.Future()  

def start_ws_server():
    print(" WebSocket Server running on ws://localhost:12345")
    asyncio.run(main_ws())

threading.Thread(target=start_ws_server, daemon=True).start()

# ==========================================
# 5. קליטת UDP (ארדואינו), בדיקת סדר ומנגנוני בטיחות
# ==========================================
def data_processor():
    global data_buffer, latest_prediction
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.bind(("", 12345))  
    print("📡 UDP Server listening on port 12345 for Arduino data...")
    
    struct_format = '<BBII16f'
    expected_size = struct.calcsize(struct_format)
    
    last_packet_counter = None
    
    while True:
        data, addr = sock.recvfrom(2048)
        
        if len(data) == expected_size:
            try:
                unpacked_data = struct.unpack(struct_format, data)
                
                sync1 = unpacked_data[0]
                sync2 = unpacked_data[1]
                packet_counter = unpacked_data[2]  
                
                if sync1 == 0xAA and sync2 == 0xBB:
                    
                    # --- מנגנון בטיחות 1: בדיקת איבוד חבילות וסדר הגעה ---
                    if last_packet_counter is not None:
                        expected_counter = (last_packet_counter + 1) & 0xFFFFFFFF
                        if packet_counter > expected_counter:
                            lost_count = packet_counter - expected_counter
                            if lost_count > 5:
                                print(" מנגנון בטיחות: איבוד קליטה משמעותי. חזרה ל-rest!")
                                latest_prediction = "rest"
                                last_packet_counter = packet_counter
                                continue
                    
                    last_packet_counter = packet_counter
                    
                    # חילוץ 16 ערכי ה-Float
                    raw_values = unpacked_data[4:20]
                    raw_signal = np.array(raw_values).reshape(16, 1)
                    
                    # עיבוד האות-ניקוי ופונקצית נירמול
                    clean_signal = spatial_filter @ raw_signal  
                    norm_signal = (clean_signal - mean_val) / std_val  
                    
                    data_buffer = np.roll(data_buffer, -1, axis=1)
                    data_buffer[:, -1] = norm_signal.flatten()
                    
                    for i in range(16):
                        data_history[i].append(norm_signal[i,0])
                        if len(data_history[i]) > BUFFER_SIZE: 
                            data_history[i].pop(0)

                    # הרצת מודל הבינה המלאכותית ברגע שהבאפר מלא
                    if data_buffer.shape[1] == BUFFER_SIZE:
                        input_tensor = torch.tensor(data_buffer[np.newaxis, np.newaxis, :, :], dtype=torch.float32)
                        
                        with torch.no_grad():
                            outputs = model(input_tensor)
                            probabilities = torch.softmax(outputs, dim=1)
                            max_prob, pred_idx = torch.max(probabilities, dim=1)
                            
                            confidence = max_prob.item()
                            pred = pred_idx.item()
                            
                            # מערך הלייבלים המקוריים של האימון שלך
                            labels = ['right hand', 'left hand', 'legs', 'toung']
                            
                            # --- הדפסת דיבאג קריטית: מפת ההסתברויות המלאה בלייב ---
                            probs_list = [f"{labels[i]}: {probabilities[0][i].item()*100:.1f}%" for i in range(4)]
                            print(f"📊 Live Probabilities -> {', '.join(probs_list)} | Winner: {labels[pred]}")
                            
                            # --- מנגנון בטיחות 2: בדיקת סף ביטחון ---
                            if confidence < CONFIDENCE_THRESHOLD:
                                new_prediction = "rest"
                            else:
                                new_prediction = labels[pred]
                            
                            if new_prediction != latest_prediction:
                                latest_prediction = new_prediction

            except Exception as e:
                print(f"Error processing packet: {e}")

threading.Thread(target=data_processor, daemon=True).start()
sys.exit(app_qt.exec()) 