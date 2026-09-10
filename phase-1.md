Yes — let's make **Phase 1 very concrete from the user's point of view**.

The goal of Phase 1 is:

> **A user can open Swasthya Saathi and already manage the basic parts of their health without needing the AI chatbot.**

## 🟢 Phase 1 — Personal Health Core

### 1. 👤 Health Profile

**User can:**

* Create their health profile
* Add/edit basic personal information
* Add height
* Add weight
* Add blood group
* Add allergies
* Add existing health conditions
* Add basic health history

**App can:**

* Show the user's current health profile
* Keep the information updated
* Use this information throughout the app

---

### 2. 🩺 Health Conditions

**User can:**

* Add a health condition
* See their conditions
* View condition details
* Mark a condition as active/resolved
* Add notes
* Update condition information

**App can:**

* Keep a list of current conditions
* Maintain condition history
* Connect a condition with relevant medications later

---

### 3. 💊 Medications

This is a **major part of Phase 1**.

**User can:**

* Add a medication
* Enter dosage
* Choose frequency
* Set medication times
* Set start date
* Set end date
* Add instructions
* Link it to a condition
* Pause/stop medication
* Edit medication
* View current medications
* View medication history

**App can:**

* Maintain the medication schedule
* Know which medications are currently active
* Know when a dose is due
* Keep the user's medication history

---

### 4. 🔔 Medication Reminders

**User can:**

* Receive a reminder when medication is due
* Snooze a reminder
* Dismiss a reminder
* Mark medicine as **Taken**
* Mark it as **Skipped**
* Mark it as **Missed**

**App can:**

* Automatically create reminders from the medication schedule
* Show today's medication schedule
* Track each dose
* Keep dose history
* Calculate basic medication adherence

Example:

```text
TODAY

8:00 AM
💊 Medicine A
[ Taken ✓ ]

2:00 PM
💊 Medicine B
[ Take ]

8:00 PM
💊 Medicine A
[ Upcoming ]
```

---

### 5. 📊 Health Measurements

**User can record:**

* Weight
* Blood pressure
* Blood glucose
* Heart rate
* Temperature
* Oxygen level
* Other basic measurements

**User can:**

* Add a measurement
* Edit/delete a measurement
* See latest measurement
* See previous measurements
* View history
* See simple trends

Example:

```text
WEIGHT

72.4 kg
↓
71.8 kg
↓
71.2 kg

Last 30 days ↓ 1.2 kg
```

**App can:**

* Store measurements with date/time
* Show latest values
* Show historical values
* Calculate basic trends

---

### 6. 🔔 General Reminders

Not everything is a medicine.

**User can create reminders for:**

* Check blood pressure
* Record weight
* Take medicine
* Drink water
* Exercise
* Doctor follow-up
* Health checkup
* Any personal health activity

**User can:**

* Create reminder
* Set date/time
* Make it recurring
* Snooze
* Complete
* Cancel

**App can:**

* Trigger reminders
* Track completion
* Keep reminder history

---

### 7. 🕐 Basic Health History

This is where the different pieces start coming together.

**User can see:**

```text
MY HEALTH HISTORY

Today
💊 Medication taken
📊 Weight recorded

Yesterday
💊 Medication missed

Sep 7
🩺 Condition added

Sep 5
💊 Medication started

Sep 1
📊 BP recorded
```

**App can:**

* Record important health events
* Organize them chronologically
* Show a simple health timeline

---

# 🎯 So what can Raiyan actually do after Phase 1?

A user can basically:

**Tell the app about themselves → manage conditions → manage medicines → get medicine reminders → record health measurements → create health reminders → track what happened.**

That's already a functioning **personal health management system**.

### And importantly:

```text
                 PHASE 1
                    │
        ┌───────────┼───────────┐
        ↓           ↓           ↓
      KNOW        MANAGE      TRACK
        │           │           │
     Profile      Meds       Measurements
     Conditions   Reminders  Medication doses
                  Schedule   Health history
```

**No AI is required for any of this.**

Then in Phase 2 we add the thing that makes the companion more **action-oriented**:

> **Goals → Plans → Tasks → Habits → Progress**

And *after that* we connect AI/RCP.

That's the clean progression. 🔥
