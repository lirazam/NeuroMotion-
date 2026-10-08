# NeuroMotion-
A full-stack, real-time BCI system for Motor Imagery classification. Features EEG data acquisition using dry comb electrodes, ADS1299 chip with TQFP-64 adapter, ESP32 microcontroller via SPI. Powered by Python(PyQt5) for DSP and EEGNet-based AI, with a dynamic React 3D avatar visualization UI. Includes full engineering documentation and user guide.

# NeuroMotion: End-to-End Real-Time BCI System for Motor Imagery Decoding and 3D Control

## Executive Summary
**NeuroMotion** is an advanced, non-invasive Brain-Computer Interface (BCI) system designed to acquire, process, decode, and visualize motor imagery brainwaves (EEG) in real time. The system bridges physical embedded hardware with high-performance digital signal processing (DSP), machine learning classification, and interactive 3D web visualization.

The overall architecture is split into two foundational layers:
1. **Hardware & Embedded Layer:** Focuses on analog signal acquisition, digitization via specialized integrated circuits, microcontroller processing, and low-latency wireless UDP packet transmission.
2. **Software, AI & Application Layer:** Focuses on real-time data ingestion, Digital Signal Processing (DSP), artifact extraction using Independent Component Analysis (ICA), Convolutional Neural Network (CNN) inference, and interactive 3D avatar visualization.

---

## End-to-End System Pipeline

+------------------------------------------------------+
|                 Dry Comb Electrodes                  | (Analog Brain Signals)
+--------------------------+---------------------------+
                           |
                           v
+------------------------------------------------------+
| ADS1299 Front-End IC (24-bit ADC, TQFP-64 Adapter)   |
+--------------------------+---------------------------+
                           | (SPI Protocol @ 250Hz)
                           v
+------------------------------------------------------+
|            ESP32 32-bit Microcontroller              |
+--------------------------+---------------------------+
                           | (Low-Latency Wi-Fi UDP Socket Stream)
                           v
+------------------------------------------------------+
| Python Backend Engine                                |
|   ├── Data Ingestion (Async UDP Listener)            |
|   ├── DSP (Bandpass 8-30Hz & Notch 50Hz)             |
|   ├── Artifact Removal (ICA Analysis)                |
|   └── Deep Learning Inference (EEGNet / CNN Model)   |
+--------------------------+---------------------------+
                           | (Decoded Movement Command)
                           v
+------------------------------------------------------+
| Frontend & Telemetry                                 |
|   ├── React 3D Interactive Avatar (WebGL Control)    |
|   ├── PyQt5 Local Control Dashboard                  |
|   └── Database Telemetry Storage                     |
+------------------------------------------------------+

### Execution Steps
1. **Signal Capture:** Motor Imagery intentions generate microvolt-level EEG signals gathered from the scalp using dry comb electrodes.
2. **Digitization & Amplification:** Analog signals are routed into a Texas Instruments ADS1299 chip mounted on a QFP/TQFP-64 adapter, converting analog inputs into high-precision 24-bit digital samples at 250 Hz.
3. **Firmware Processing:** The 32-bit ESP32 microcontroller communicates with the ADS1299 over hardware SPI, reading sample registers, packing bytes into structured network buffers, and broadcasting UDP sockets over Wi-Fi.
4. **Backend Ingestion & Filtering:** A Python backend server intercepts incoming UDP packets without blocking. Bandpass (8-30 Hz) and Notch (50 Hz) filters isolate mu/beta wave bands and suppress powerline interference.
5. **Artifact Removal & AI Classification:** Independent Component Analysis (ICA) isolates ocular and muscle movement artifacts. Cleaned EEG frames are evaluated by an EEGNet CNN model to predict target motor imagery classes.
6. **3D Visualization:** Classified intent translates into movement commands sent to a React-based 3D avatar UI for real-time visual feedback and recorded in database telemetry.

---

## PDF Project Books Breakdown

The complete engineering specification is divided into two specialized documentation volumes inside the `docs/` folder:

### 1. Hardware & Embedded Project Book (`NeuroMotion_Hardware_Project_Book.pdf`)
Covers the physical engineering, hardware integration, and firmware implementation:
* **Circuit & Physical Design:** Schematics for dry comb electrode placement, pin connections, and mounting the ADS1299 chip via a TQFP-64 adapter.
* **SPI Communication & Register Control:** Detailed timing diagrams and register configurations used by the ESP32 microcontroller to interface with the ADS1299 24-bit ADC at 250 Hz.
* **Firmware Implementation:** Embedded C/C++ firmware architecture, ring buffering, interrupt handlers, and low-latency UDP socket packet construction over Wi-Fi.
* **Signal Quality & Shielding:** Power supply isolation, ground plane optimization, and noise reduction techniques for biosignal acquisition.

### 2. Software & AI Project Book (`NeuroMotion_Software_Project_Book.pdf`)
Covers system analysis, algorithmic data pipelines, machine learning models, and user interfaces:
* **System Requirements & UML:** Detailed Use Case diagrams, system flowcharts, database schemas, and module trees.
* **DSP & Machine Learning Architecture:** Mathematical foundations of Butterworth filtering, ICA artifact extraction, and the EEGNet convolutional neural network setup.
* **Asynchronous Data Ingestion:** Python network architecture optimized for sub-200ms processing latency.
* **Frontend UI & Database:** React 3D graphics pipeline (Three.js/WebGL), PyQt5 desktop control dashboard, and database models for storing telemetry and patient session logs.

---

## Repository File & Directory Structure

docs/
├── NeuroMotion_Hardware_Project_Book.pdf  # Physical circuit design, SPI registers, ESP32 firmware
└── NeuroMotion_Software_Project_Book.pdf  # DSP algorithms, ICA, EEGNet model, UML, React 3D UI
images/
├── hardware_setup.png                     # ESP32 + ADS1299 + TQFP-64 hardware integration
├── circuit_schematic.png                  # Pinout and physical wiring diagrams
├── avatar_3d_simulation.png              # React 3D avatar visualization screenshot
└── architecture_diagram.png               # System data pipeline overview
src/
├── firmware/                              # Embedded C/C++ Code (ESP32)
│   ├── main.cpp                           # Core setup and main execution loop
│   ├── ads1299.h / ads1299.cpp            # SPI driver and register configuration for ADS1299
│   └── wifi_udp.h / wifi_udp.cpp          # Wi-Fi stack and UDP packet streaming
├── backend/                               # Python Signal Processing & AI Processing
│   ├── main.py                            # Asynchronous server entry point
│   ├── udp_listener.py                    # Real-time UDP socket receiver
│   ├── dsp_pipeline.py                    # Bandpass & Notch filter algorithms
│   ├── ica_cleaner.py                     # ICA artifact removal pipeline
│   ├── eegnet_model.py                    # Pre-trained CNN model for signal classification
│   └── pyqt_gui.py                        # Desktop GUI interface for signal monitoring
└── frontend/                              # Web Application (React + WebGL)
    ├── public/                            # Static assets and 3D avatar models
    ├── src/
    │   ├── App.jsx                        # Main React application entry
    │   ├── components/Avatar3D.jsx        # 3D avatar rendering engine
    │   └── components/TelemetryPanel.jsx # Real-time telemetry monitoring component
    └── package.json                       # Project dependencies
README.md                                  # Repository overview and execution guide
