# StructCalc Pro 🏗️

**StructCalc Pro** is a professional-grade, web-based structural analysis tool built with **React**, **TypeScript**, and **Tailwind CSS**. It allows engineers and students to analyze beam configurations, calculate reactions, view shear/moment diagrams, and verify design safety factors in real-time.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## 🌟 Key Features

### 📐 Analysis Engine
*   **Beam Types:** Simply Supported, Cantilever, Fixed-Fixed.
*   **Load Configurations:**
    *   Point Loads
    *   Uniformly Distributed Loads (UDL)
    *   Triangular/Trapezoidal Distributed Loads
*   **Math:** Uses direct integration and equilibrium equations to solve for reactions, shear, bending moment, and deflection.

### 🛠️ Configuration
*   **Material Library:** Pre-set materials (Steel A36, Aluminum 6061, Titanium, Concrete, Carbon Fiber, etc.) with correct Young's Modulus and Yield Strength.
*   **Cross-Sections:** Rectangle, Circle, Hollow Circle, and I-Beam.
*   **Auto-Calculation:** Automatically calculates Area ($A$), Moment of Inertia ($I$), and distance to neutral axis ($c$) based on dimensions.

### 📊 Visualization & Results
*   **Interactive Diagrams:** dynamic Shear Force Diagrams (SFD) and Bending Moment Diagrams (BMD).
*   **Free Body Diagram (FBD):** Real-time SVG visualization of the beam, supports, and loads.
*   **Safety Checks:** Calculates Maximum Stress ($\sigma = Mc/I$), Deflection, and Factor of Safety (FOS) with visual pass/fail indicators.
*   **Unit Conversion:** Seamless toggling between **SI** (Metric) and **Imperial** units.

## 🚀 Getting Started

### Prerequisites
*   [Node.js](https://nodejs.org/) (v16 or higher recommended)
*   npm (comes with Node.js)

### Installation

1.  **Clone the repository** (or download source files):
    ```bash
    git clone https://github.com/yourusername/struct-calc-pro.git
    cd struct-calc-pro
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```

4.  **Open Browser:**
    Navigate to `http://localhost:5173` (or the port shown in your terminal).

## 📂 Project Structure

```text
src/
├── components/
│   ├── ui/               # Reusable UI components (Buttons, Inputs, Cards)
│   ├── BeamVisualizer.tsx # SVG Free Body Diagram renderer
│   └── Diagram.tsx       # Shear/Moment graph renderer
├── utils/
│   ├── calculations.ts   # Core physics engine and static analysis logic
│   └── units.ts          # Unit conversion and formatting logic
├── App.tsx               # Main application controller
├── types.ts              # TypeScript interfaces and Material data constants
└── index.tsx             # Entry point
```

## 🧮 How It Works

1.  **Input:** User defines beam length, supports, cross-section, and material.
2.  **Loads:** User adds external loads (Point, UDL, Triangular).
3.  **Process:**
    *   The app sums forces and moments to calculate Support Reactions ($R_1, R_2, M_1$).
    *   It iterates along the beam length (150+ points) to calculate Shear ($V$) and Moment ($M$) at every point.
    *   It determines Max Stress based on the geometry ($I, c$).
4.  **Output:** Results are rendered in the UI and Diagrams.

## ⚠️ Disclaimer

**Educational Use Only.** While this tool uses standard engineering formulas, it is intended for educational purposes and preliminary design. It should not be used as the sole basis for professional structural engineering certification or construction without independent verification by a licensed engineer.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
