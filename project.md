I want to make an important architectural/product shift in Swasthya Saathi.

Right now, the app is primarily a chatbot. Before we add more AI tools or connect RCP, I want us to build the actual **Health Companion system underneath the chatbot**.

The core idea is:

**AI should be one way of interacting with Swasthya Saathi, not Swasthya Saathi itself.**

The Health Companion should be able to work without AI. The user should be able to manage their health, take actions, track progress, receive reminders, and view their health journey through the normal app/system.

The AI will later sit on top of this system and help the user interact with it naturally.

### What I am thinking

We should first build the Health Companion Core in prioritized phases.

**Phase 1 — Personal Health Core**

* Health Profile
* Health Conditions
* Medications
* Medication Schedule
* Medication Reminders
* Health Measurements
* Basic Health History
* Generic Reminders

**Phase 2 — Goals & Actions**

* Health Goals
* Health Plans
* Tasks / Actions
* Habits
* Goal Progress

**Phase 3 — Healthcare**

* Medical Reports / Records
* Appointments
* Treatment
* Symptoms

**Phase 4 — Companion**

* Prevention
* Health Timeline
* Overall Progress
* Insights
* Safety / Escalation

**Phase 5 — AI / RCP**

* Define the capabilities of the Health Companion
* Expose those capabilities through RCP
* Host/connect the RCP service at `rcp.hasanraiyan.me`
* Connect the chatbot to those capabilities
* Let AI read health context and perform permitted actions through the capability layer

### Most important architectural principle

The **Health Companion Core owns the health state and business logic.**

The AI should NOT become the owner of health data or health state.

For example:

If a user says:

"I took my medicine."

The AI should eventually understand the request and invoke the appropriate capability, but the actual medication dose history should be recorded by the Health Companion system.

Similarly:

"I want to lose 5 kg."

The AI may help create the goal and plan, but the goal, plan, progress, and completion history belong to the core system.

### For now

I am NOT asking you to implement all of this yet.

I want you to first understand this direction and compare it with the current Swasthya Saathi architecture.

Then we will go module by module, starting with **Phase 1 — Personal Health Core**, and decide:

1. What the module should do
2. What data it needs
3. What actions the user can perform
4. What capabilities the system needs
5. What UI is required
6. What should be stored vs calculated
7. What can later be exposed to AI/RCP

Do not redesign the existing architecture unnecessarily. Preserve the current architectural principles where they already make sense.

The goal is to evolve Swasthya Saathi from:

**"an AI health chatbot"**

into:

**"a real Health Companion with AI as an intelligent interface."**
