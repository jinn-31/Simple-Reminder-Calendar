const datePicker = document.getElementById("datePicker");
const reminderInput = document.getElementById("reminderInput");
const reminderList = document.getElementById("reminderList");
const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");

let currentDate = new Date();
let selectedDate = new Date();

// Ask notification permission on load
if ("Notification" in window) {
  Notification.requestPermission();
}

function sendNotification(text) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification("📅 Reminder", {
        body: text,
        icon: "icon.png",
        badge: "icon.png"
      });
    });
  }
}

const toggle = document.getElementById("timeFormatToggle");
const toggleLabel = document.getElementById("timeFormatLabel");

function updateTimeFormatLabel() {
  if (toggle.checked) {
    toggleLabel.textContent = "Switch to 12-hour format";
  } else {
    toggleLabel.textContent = "Switch to 24-hour format";
  }
}

// Load saved preference
toggle.checked = localStorage.getItem("use24Hour") === "true";

updateTimeFormatLabel();

toggle.addEventListener("change", () => {
  localStorage.setItem("use24Hour", toggle.checked);
  updateTimeFormatLabel();
  renderReminders();
});

function formatTime(time) {
  const use24Hour = document.getElementById("timeFormatToggle").checked;

  if (use24Hour) return time;

  let [hours, minutes] = time.split(":");
  hours = parseInt(hours);

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;

  return `${hours}:${minutes} ${ampm}`;
}

const noteInput = document.getElementById("noteInput");
const saveNoteBtn = document.getElementById("saveNoteBtn");

function getNotes() {
  return JSON.parse(localStorage.getItem("notes")) || {};
}

function saveNotes(data) {
  localStorage.setItem("notes", JSON.stringify(data));
}

function renderCalendar() {
  calendar.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  monthYear.textContent = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric"
  });

  const reminders = getReminders();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    calendar.appendChild(empty);
  }

  for (let day = 1; day <= lastDate; day++) {
    const dayBox = document.createElement("div");
    dayBox.classList.add("day");
    dayBox.textContent = day;

    const fullDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (fullDate === selectedDate.toISOString().split("T")[0]) {
      dayBox.classList.add("selected-day");
    }

    if (reminders[fullDate]) {
      dayBox.classList.add("has-reminder");
    }

    dayBox.addEventListener("click", () => {
      selectedDate = new Date(fullDate);
      datePicker.value = fullDate;
      renderCalendar();
      renderReminders();
      loadNote();
    });

    calendar.appendChild(dayBox);
  }
}

saveNoteBtn.addEventListener("click", () => {
  const date = selectedDate.toISOString().split("T")[0];
  const notes = getNotes();

  notes[date] = noteInput.value;

  saveNotes(notes);

  saveNoteBtn.textContent = "Saved ✔";

  setTimeout(() => {
    saveNoteBtn.textContent = "Save Note";
  }, 1000);
});

function loadNote() {
  const date = selectedDate.toISOString().split("T")[0];
  const notes = getNotes();

  noteInput.value = notes[date] || "";
}

document.getElementById("prevMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();

});

renderCalendar();

// default date = today
datePicker.valueAsDate = new Date();

function renderReminders() {
  console.log("renderReminders running");
  const date = selectedDate.toISOString().split("T")[0];
  const data = getReminders();

  reminderList.innerHTML = "";

  console.log("Rendering for:", date);
  console.log("All data:", data);

  if (!data[date]) return;

  data[date].forEach((reminder, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      <span>${formatTime(reminder.time)} - ${reminder.text}</span>
      <button onclick="deleteReminder('${date}', ${index})">X</button>
    `;

    reminderList.appendChild(li);
  });
}

function checkReminders() {
  const now = new Date();

  const currentDate = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().slice(0, 5);

  const data = getReminders();

  if (data[currentDate]) {
    data[currentDate].forEach(reminder => {
      if (
        reminder.time === currentTime &&
        !reminder.notified
      ) {
        sendNotification(reminder.text);
        reminder.notified = true;
      }
    });

    saveReminders(data);
  }
}

checkReminders();
setInterval(checkReminders, 30000);

function saveReminders(data) {
  localStorage.setItem("reminders", JSON.stringify(data));
}

function getReminders() {
  return JSON.parse(localStorage.getItem("reminders")) || {};
}

function addReminder() {
    console.log(getReminders());
  const date = datePicker.value;
  const text = reminderInput.value.trim();
  const time = document.getElementById("timeInput").value;

  if (!text || !time) return;

  const data = getReminders();

  if (!data[date]) {
    data[date] = [];
  }

  data[date].push({
    text,
    time,
    notified: false
  });

  saveReminders(data);

  sendNotification(`Reminder set for ${time}: ${text}`);

  reminderInput.value = "";
  document.getElementById("timeInput").value = "";

  renderReminders();
}

function deleteReminder(date, index) {
  const data = getReminders();

  data[date].splice(index, 1);

  if (data[date].length === 0) {
    delete data[date];
  }

  saveReminders(data);
  renderReminders();
}

document.getElementById("enableNotifBtn").addEventListener("click", async () => {
  if (!("Notification" in window)) {
    alert("Notifications not supported");
    return;
  }

  const permission = await Notification.requestPermission();

  if (permission === "granted") {
    alert("Notifications enabled!");
  } else {
    alert("Notifications blocked");
  }
});

// update when date changes
datePicker.addEventListener("change", renderReminders);



// first load
renderReminders();