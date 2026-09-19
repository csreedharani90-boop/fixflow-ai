# FixFlow 🔧

## AI Technician Troubleshooting Assistant for Industrial Motors

**Smarter Diagnostics. Safer Operations. Higher Uptime.**

FixFlow is an AI-powered troubleshooting assistant designed to help technicians quickly diagnose industrial motor and controller faults.

Instead of manually searching through large technical manuals, technicians can enter a symptom or fault code and receive relevant technical evidence, likely causes, recommended checks, and safety guidance.

---

## 🚨 Problem

Industrial technicians often spend significant time diagnosing motor faults because:

- Technical information is spread across manuals and documents.
- Fault codes can be difficult to interpret quickly.
- Troubleshooting requires experience and domain knowledge.
- Incorrect diagnosis can lead to equipment damage or unsafe operation.
- Motor downtime directly affects productivity.

---

## 💡 Solution

FixFlow provides an intelligent troubleshooting workflow:

**Technician Query → Knowledge Retrieval → AI-Assisted Diagnosis → Evidence → Troubleshooting Guidance**

The system analyzes the technician's input and provides:

- Fault diagnosis
- Possible causes
- Recommended checks
- Severity level
- Confidence level
- Technical evidence
- Safety guidance

---

## 🚀 Key Features

### 🤖 AI-Assisted Troubleshooting

Technicians can enter motor symptoms, fault codes, or problems and receive structured troubleshooting guidance.

### 🔎 Knowledge Retrieval with Moss

FixFlow integrates Moss-powered retrieval to identify relevant technical knowledge and supporting evidence for troubleshooting queries.

### 📚 Evidence-Grounded Results

The system displays supporting evidence alongside the diagnosis, helping technicians understand why a particular fault is being suggested.

### 🎙️ Voice-Based Interaction

LiveKit enables voice interaction so technicians can communicate with FixFlow hands-free during troubleshooting.

### ⚠️ Safety Guidance

The system provides safety-oriented recommendations before technicians perform troubleshooting checks.

### 📊 Severity & Confidence

Each diagnosis includes severity and confidence information to help technicians understand the urgency and certainty of the result.

---

## 🏗️ Architecture

```text
┌─────────────────────────────┐
│        Technician           │
│   Symptom / Fault Code      │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│        FixFlow UI            │
│      Next.js + React         │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│          API Layer           │
│       Next.js Route          │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│    Knowledge Retrieval       │
│       Moss Integration       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│   AI-Assisted Diagnosis      │
│   Causes + Checks + Safety   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│      Technician Result       │
│ Evidence + Diagnosis +       │
│ Safety Guidance              │
└─────────────────────────────┘
```

---

## 🔄 Troubleshooting Workflow

```text
1. Technician enters symptom or fault code
                    ↓
2. FixFlow processes the query
                    ↓
3. Relevant technical knowledge is retrieved
                    ↓
4. Diagnosis is generated
                    ↓
5. Supporting evidence is displayed
                    ↓
6. Causes and recommended checks are shown
                    ↓
7. Safety guidance is provided
```

---

## 🧪 Example Faults

| Input | Diagnosis | Severity | Confidence |
|------|-----------|----------|------------|
| E17 / Overheating | Motor Over-Temperature | HIGH | 92% |
| E21 / High Current | Over-Current | HIGH | 89% |
| E09 / Vibration | Abnormal Vibration | MEDIUM | 86% |

These examples demonstrate how FixFlow converts technician inputs into structured troubleshooting results.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|-----------|---------|
| Next.js | Web application and API layer |
| React | User interface |
| TypeScript | Application development |
| Moss | Knowledge retrieval |
| LiveKit | Real-time voice interaction |
| Vercel | Deployment |
| GitHub | Source control |

---

## 📁 Project Structure

```text
fixflow-ai/
│
├── app/
│   ├── api/
│   │   ├── livekit/
│   │   └── moss-search/
│   │
│   ├── page.tsx
│   └── ...
│
├── public/
│
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
└── README.md
```

---

## 🎙️ Voice Interaction

FixFlow integrates LiveKit to support voice-based technician interaction.

A technician can speak a problem instead of manually typing the fault description, making the troubleshooting workflow more practical for hands-busy industrial environments.

---

## 🔐 Safety-Oriented Design

Industrial troubleshooting can involve potentially hazardous equipment.

FixFlow therefore presents safety guidance together with troubleshooting information, helping technicians consider safe inspection procedures before interacting with equipment.

> FixFlow is an AI-assisted troubleshooting tool and should not replace qualified technicians, manufacturer documentation, or established industrial safety procedures.

---

## 🌐 Live Demo

**[🔧 FixFlow – Live Demo](https://fixflow-moss-dpcvo2iv6-sree-7b83.vercel.app/)**

---

## 💻 GitHub Repository

**[View FixFlow on GitHub](https://github.com/csreedharani90-boop/fixflow-ai)**

---

## ▶️ Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/csreedharani90-boop/fixflow-ai.git
cd fixflow-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file and configure the required Moss and LiveKit environment variables.

### 4. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## 🎯 Hackathon Value

FixFlow focuses on reducing the time required to diagnose industrial motor problems by combining:

- AI-assisted troubleshooting
- Knowledge retrieval
- Evidence-based results
- Voice interaction
- Safety guidance
- Structured fault analysis

The goal is to help technicians move from **symptom → evidence → diagnosis → action** through a single troubleshooting interface.

---

## 📌 Project

**FixFlow 🔧**

**AI Technician Troubleshooting Assistant for Industrial Motors**

**Smarter Diagnostics. Safer Operations. Higher Uptime.**
