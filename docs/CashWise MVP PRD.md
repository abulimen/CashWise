# CashWise – Hackathon MVP PRD

---

## 1. Product Overview

CashWise is a conversational AI-powered financial assistant that helps students make smarter spending decisions in real time. The core experience centers on answering one critical question:

> “Can I afford this?”

The MVP focuses on delivering a trustworthy, explainable decision-making experience rather than full financial infrastructure.

---

## 2. Objective (Hackathon Scope)

Build a working demo that:

* Demonstrates AI-assisted financial decision-making
* Emphasizes transparency and trust
* Feels real and usable within a short interaction

Success is defined by:

* A smooth demo flow
* Clear reasoning in AI responses
* Strong user understanding within 30–60 seconds

---

## 3. Target Users

Primary users:

* Nigerian university students

User characteristics:

* Limited or fixed monthly income (allowance)
* Struggle with spending decisions
* Want better control over money

---

## 4. Core Problem

Students lack real-time clarity when making spending decisions, leading to impulsive purchases, regret, and poor financial planning.

Additionally, students do not fully trust AI systems in finance due to lack of transparency.

---

## 5. Core Value Proposition

CashWise helps students make financial decisions they can trust by:

* Explaining the impact before they spend
* Showing reasoning clearly
* Keeping the user in control

---

## 6. MVP Features

### 6.1 AI Copilot Chat (CORE FEATURE)

Description:
A conversational interface where users ask financial questions.

Primary Use Case:
User asks: “Can I afford ₦12,000 for this item?”

System Response Includes:

* Current balance
* Daily spending estimate
* Impact of purchase
* Recommendation (Yes / No / Caution)
* Alternative suggestion

Requirements:

* Input field for user query
* Display chat messages
* AI-generated response (or structured logic)

---

### 6.2 Simulated Financial Context

Description:
Mock financial data used to simulate real user context.

Includes:

* Current balance (e.g., ₦31,500)
* Days remaining
* Average daily spending
* Savings goal

Purpose:

* Feed AI responses
* Create realistic demo

---

### 6.3 Trust Score (Basic)

Description:
A simple score (0–100) representing financial behavior.

Logic (Rule-Based):

* Spending discipline
* Savings consistency
* Balance stability

Display:

* Numeric score
* Simple label (Good / Fair / Risky)

---

### 6.4 Auto-Stash (Light Simulation)

Description:
AI suggests saving a portion of incoming funds.

Interaction:

* “You just received ₦20,000. Save ₦6,000?”
* User can accept or adjust

Purpose:

* Demonstrate intelligent financial nudging

---

## 7. User Flow (Demo)

1. User opens app
2. Sees balance + simple dashboard
3. Enters question: “Can I afford this?”
4. AI responds with explanation
5. User sees recommendation
6. Optional: interacts with Auto-Stash

Total demo time: 30–60 seconds

---

## 8. Non-Goals (DO NOT BUILD)

* Real bank integration (Mono)
* Real payments or loan disbursement
* Full backend infrastructure
* Complex ML models

These should be simulated or described, not implemented.

---

## 9. Technical Approach

Frontend:

* Simple web or mobile UI
* Chat interface

Backend (optional):

* Basic API or local logic

AI:

* Prompt-based responses OR
* Structured logic mimicking AI

Data:

* Mock JSON data

---

## 10. Success Criteria

The MVP is successful if:

* The demo is smooth and fast
* The AI response feels intelligent and personalized
* Judges understand the value instantly
* The system appears trustworthy and explainable

---

## 11. Risks & Mitigation

Risk: Overbuilding
Mitigation: Focus only on core chat experience

Risk: Slow AI response
Mitigation: Predefine or optimize responses

Risk: Confusing UI
Mitigation: Keep interface minimal

---

## 12. Demo Script Anchor

Key moment:
User asks: “Can I afford ₦12k hoodie?”

System shows:

* Balance breakdown
* Daily spend
* Consequence
* Recommendation

This is the highlight of the product.

---

## 13. Key Principle

> Build for clarity, not completeness.

---

**End of PRD**
