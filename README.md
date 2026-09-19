# FixFlow 🔧

## AI Technician Troubleshooting Assistant for Industrial Motors

**Smarter Diagnostics. Safer Operations. Higher Uptime.**

FixFlow is an AI-powered troubleshooting assistant designed to help technicians quickly diagnose industrial motor and controller faults.

Instead of manually searching through large technical manuals, technicians can enter a symptom or fault code and receive relevant technical evidence, likely causes, recommended checks, and safety guidance.

---

## 🚨 Problem

Industrial technicians often spend significant time diagnosing motor faults because:

- Technical information is spread across manuals and documents.
- Fault codes are difficult to interpret quickly.
- Troubleshooting requires experience and domain knowledge.
- Incorrect diagnosis can lead to equipment damage or unsafe operation.
- Downtime directly affects productivity.

---

## 💡 Solution

FixFlow combines:

**Technician Query → Moss Knowledge Retrieval → AI Diagnosis → Evidence → Troubleshooting Guidance**

The system retrieves relevant technical knowledge and presents it together with an AI-assisted diagnosis.

---

## 🏗️ Architecture

```text
┌─────────────────────┐
│      Technician     │
│  Symptom / Fault    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   FixFlow UI        │
│ Next.js + React     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    API Layer        │
│   Next.js Route     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Moss Retrieval     │
│ fixflow-knowledge-v2│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ AI Diagnosis Layer  │
│ Causes + Checks     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Technician Result   │
│ Evidence + Safety   │
└─────────────────────┘
## ?? Live Demo

[?? FixFlow � Live Demo](https://fixflow-moss-dpcvo2iv6-sree-7b83.vercel.app/)
