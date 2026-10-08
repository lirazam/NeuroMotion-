//#include <WiFi.h>
//#include <WiFiUdp.h>
//#include "eeg_dataset.h" // מאגר הנתונים שיצרתי בפייתון בעזרת הסימולטור
//
//// הגדרות הרשת -בהתאם לנקודה חמה
//const char* ssid = "LIRAZ_AMSALEM 6383";     
//const char* password = "72Qx$466"; 
//const char* computerIP = "192.168.137.1"; 
//const int port = 12345;
//
//WiFiUDP udp;
//
//// ============================================================================
//// קוד עיבוד אותות ב-Low-Level (C++) - מסננים דיגיטליים בזמן אמת
//// ============================================================================
//
//// מחלקה המייצגת מסנן מסדר שני (Biquad Filter) במבנה Direct Form II Transposed
//class Biquad {
//private:
//    float b0, b1, b2, a1, a2;
//    float z1, z2;
//public:
//    Biquad(float _b0, float _b1, float _b2, float _a1, float _a2) {
//        b0 = _b0; b1 = _b1; b2 = _b2;
//        a1 = _a1; a2 = _a2;
//        z1 = 0.0; z2 = 0.0;
//    }
//    
//    // פונקציה לעיבוד דגימה בודדת בזמן אמת
//    float process(float in) {
//        float out = in * b0 + z1;
//        z1 = in * b1 + z2 - a1 * out;
//        z2 = in * b2 - a2 * out;
//        return out;
//    }
//};
//
//// מחלקה המשרשרת מסננים (עבור מסנן Bandpass מסדר 4 המורכב משני שלבי SOS)
//class FilterChain {
//private:
//    Biquad* stages[2];
//    int num_stages;
//public:
//    FilterChain() : num_stages(0) {}
//    
//    void addStage(float b0, float b1, float b2, float a1, float a2) {
//        if(num_stages < 2) {
//            stages[num_stages++] = new Biquad(b0, b1, b2, a1, a2);
//        }
//    }
//    
//    float process(float in) {
//        float out = in;
//        for (int i = 0; i < num_stages; i++) {
//            out = stages[i]->process(out);
//        }
//        return out;
//    }
//};
//
//// מערכים המכילים את אובייקטי הסינון בנפרד לכל אחד מ-16 הערוצים
//FilterChain bandpass_filters[16];
//Biquad* notch_filters[16];
//
//// ============================================================================
//
//// מבנה הפריים ל-16 ערוצים)
//struct __attribute__((__packed__)) EEG_Frame {
//    uint8_t sync1 = 0xAA;
//    uint8_t sync2 = 0xBB;
//    uint32_t counter;      
//    uint32_t timestamp;     
//    float eeg_channels[16]; 
//};
//
//int current_task = 0; // 0 = המתנה, 1 = ימין, 2 = שמאל, 3 = רגליים, 4 = לשון
//int current_index = 0;       
//uint32_t packet_id = 0;      
//unsigned long last_send_time = 0;
//const unsigned long interval_micros = 4000; // 4 מילישניות = 250Hz קצב דגימה מדויק
//
//void setup() {
//  Serial.begin(115200);
//
//  // אתחול מסנני תדרים עבור 16 הערוצים
//  for (int i = 0; i < 16; i++) {
//     // 1. מסנן Notch לתדר 50Hz (ישראל) - מחושב עבור 250Hz
//     // b0=0.963, b1=-0.1215, b2=0.963, a1=-0.1215, a2=0.926
//     notch_filters[i] = new Biquad(0.963001, -0.121544, 0.963001, -0.121544, 0.926002);
//
//     // 2. מסנן Bandpass לתדרים 8Hz עד 31Hz (מסדר 4)
//     // במקום לנסות לחשב מקדמים מורכבים ידנית, אלו המקדמים המדויקים ל-250Hz:
//     
//     // שלב SOS ראשון (הגברה ותדר נמוך)
//     bandpass_filters[i].addStage(0.0468, 0, -0.0468, -1.6293, 0.9064);
//     
//     // שלב SOS שני (תדר גבוה ויציבות)
//     bandpass_filters[i].addStage(1.0, -1.6293, 1.0, -1.6293, 0.9064);
//  }
//
//  // שאר הקוד נשאר אותו דבר (WiFi וכו')
//  Serial.print("Connecting to Wi-Fi: ");
//  WiFi.begin(ssid, password);
//  while (WiFi.status() != WL_CONNECTED) {
//    delay(500);
//    Serial.print(".");
//  }
//  udp.begin(port);
//}
//
//void loop() {
//  unsigned long current_time = micros();
//
//  // שמירה על קצב דגימה מדויק של 250 הרץ
//  if (current_time - last_send_time >= interval_micros) {
//    last_send_time = current_time;
//
//    // יצירת מופע חדש של מבנה ה-16 ערוצים
//    EEG_Frame frame;
//    frame.counter = packet_id++;  // עדכון המשתנה הנכון במבנה
//    frame.timestamp = millis();    // עדכון חותמת הזמן
//
//    // לולאה שממלאת את 16 הערוצים בנתונים מתוך ה-Flash
//    for (int ch = 0; ch < 16; ch++) {
//      // כדי שהערוצים לא יהיו זהים לחלוטין, ניקח לכל ערוץ נקודה קצת שונה במאגר (בקפיצות של 20 דגימות)
//      int shifted_index = (current_index + (ch * 20)) % DATA_SIZE;
//      
//      // קריאת הערך העשרוני והכנסתו לערוץ המתאים במערך
//      float raw_signal = pgm_read_float(&eeg_data[shifted_index]);
//
//      // --- שלב עיבוד הנתונים הדיגיטלי (ניקוי בזמן אמת בתוך הבקר) ---
//      // 1. העברת האות הגולמי דרך מסנן ה-Bandpass (תדרים 1-40 הרץ)
//      float bandpassed_signal = bandpass_filters[ch].process(raw_signal);
//
//      // 2. העברת האות המסונן דרך מסנן ה-Notch (הורדת רעש רשת של 60 הרץ)
//      float clean_signal = notch_filters[ch]->process(bandpassed_signal);
//      
//      // שמירת האות הנקי הסופי לתוך מבנה הפריים שנשלח למחשב
//      frame.eeg_channels[ch] = clean_signal;
//    }
//
//    // שליחת הפריים המלא (74 בתים) ב-UDP ישירות למחשב
//    udp.beginPacket(computerIP, port);
//    udp.write((uint8_t*)&frame, sizeof(frame));
//    udp.endPacket();
//
//    // קידום אינדקס הזמן הראשי וחזרה להתחלה אם הגענו לסוף המערך
//    current_index++;
//    if (current_index >= DATA_SIZE) {
//      current_index = 0;
//    }
//  }
//}

#include <WiFi.h>
#include <WiFiUdp.h>
#include "eeg_dataset.h" //

// הגדרות רשת
const char* ssid = "LIRAZ_AMSALEM 6383";     
const char* password = "72Qx$466"; 
const char* computerIP = "192.168.137.1"; 
const int port = 12345;

WiFiUDP udp;

// --- מחלקות לעיבוד אותות (DSP) ---
class Biquad {
private:
    float b0, b1, b2, a1, a2, z1, z2;
public:
    Biquad(float _b0, float _b1, float _b2, float _a1, float _a2) : 
        b0(_b0), b1(_b1), b2(_b2), a1(_a1), a2(_a2), z1(0), z2(0) {}
    
    float process(float in) {
        float out = in * b0 + z1;
        z1 = in * b1 + z2 - a1 * out;
        z2 = in * b2 - a2 * out;
        return out;
    }
};

class FilterChain {
private:
    Biquad* stages[2];
    int num_stages = 0;
public:
    void addStage(float b0, float b1, float b2, float a1, float a2) {
        if(num_stages < 2) stages[num_stages++] = new Biquad(b0, b1, b2, a1, a2);
    }
    float process(float in) {
        for (int i = 0; i < num_stages; i++) in = stages[i]->process(in);
        return in;
    }
};

FilterChain bandpass_filters[16];
Biquad* notch_filters[16];

struct __attribute__((__packed__)) EEG_Frame {
    uint8_t sync1 = 0xAA; uint8_t sync2 = 0xBB;
    uint32_t counter; uint32_t timestamp;
    float eeg_channels[16]; 
};

// משתני ניהול דאטה
const float* current_data = nullptr;
int current_size = 0;
int play_index = 0;
bool is_playing = false;
uint32_t packet_id = 0;

void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) delay(500);
    udp.begin(port);

    for (int i = 0; i < 16; i++) {
        notch_filters[i] = new Biquad(0.963001, -0.121544, 0.963001, -0.121544, 0.926002);
        bandpass_filters[i].addStage(0.0468, 0, -0.0468, -1.6293, 0.9064);
        bandpass_filters[i].addStage(1.0, -1.6293, 1.0, -1.6293, 0.9064);
    }
}

void loop() {
    // 1. קבלת פקודה מהמחשב
    int packetSize = udp.parsePacket();
    if (packetSize) {
        char cmd = udp.read();
        
        // כאן אנחנו משייכים את המערכים מתוך eeg_dataset.h לפי הפקודה
        if (cmd == '1') { 
            current_data = right_hand_data; 
            current_size = sizeof(right_hand_data) / sizeof(float); 
        }
        else if (cmd == '2') { 
            current_data = left_hand_data; 
            current_size = sizeof(left_hand_data) / sizeof(float); 
        }
        else if (cmd == '3') { 
            current_data = feet_data; 
            current_size = sizeof(feet_data) / sizeof(float); 
        }
        else if (cmd == '4') { 
            current_data = tongue_data; 
            current_size = sizeof(tongue_data) / sizeof(float); 
        }
        
        play_index = 0;
        is_playing = true;
    }

    // 2. שידור דאטה
    if (is_playing && current_data != nullptr) {
        if (play_index + 16 < current_size) {
            EEG_Frame frame;
            frame.counter = packet_id++;
            frame.timestamp = millis();

            for (int ch = 0; ch < 16; ch++) {
                float raw = pgm_read_float(&current_data[play_index + ch]);
                float filtered = bandpass_filters[ch].process(raw);
                filtered = notch_filters[ch]->process(filtered);
                frame.eeg_channels[ch] = filtered;
            }

            udp.beginPacket(computerIP, port);
            udp.write((uint8_t*)&frame, sizeof(frame));
            udp.endPacket();

            play_index += 16;
            delay(4); // 250Hz
        } else {
            is_playing = false; // סיום שידור
        }
    }
}