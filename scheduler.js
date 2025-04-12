class Machine {
  constructor(name) {
    this.name = name;
    this.availableAt = getCurrentTimeInMinutes(); // Initialize based on real time
  }

  scheduleTask(processTime, currentTime) {
    const startTime = Math.max(currentTime, this.availableAt);
    const endTime = startTime + processTime;
    this.availableAt = endTime;
    return { machine: this.name, startTime, endTime };
  }
}

class Product {
  constructor(partNo, processes) {
    this.partNo = partNo;
    this.processes = processes;
  }

  scheduleProcesses(machines, quantity, startTime) {
    const schedule = [];
    let totalTime = startTime;

    for (let i = 0; i < quantity; i++) {
      let unitTime = startTime;

      for (const process of this.processes) {
        const { name, processTime, machineNeeded } = process;

        let machine;
        if (Array.isArray(machineNeeded)) {
          machine = this.findAvailableMachine(
            machines,
            machineNeeded,
            unitTime
          );
        } else {
          machine = machines.find((m) => m.name === machineNeeded);
        }

        if (machine) {
          const task = machine.scheduleTask(processTime, unitTime);
          schedule.push({ partNo: this.partNo, process: name, ...task });
          unitTime = task.endTime;
          totalTime = Math.max(totalTime, unitTime);
        }
      }
    }

    return { schedule, totalTime };
  }

  findAvailableMachine(machines, machineNames, currentTime) {
    const availableMachines = machines.filter((m) =>
      machineNames.includes(m.name)
    );
    availableMachines.sort((a, b) => a.availableAt - b.availableAt);
    return availableMachines[0] || null;
  }
}

// Helper: get current time in minutes
function getCurrentTimeInMinutes() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// Convert minutes to 24-hour HH:MM format
function convertToTime(timeInMinutes) {
  const hours = Math.floor(timeInMinutes / 60);
  const minutes = timeInMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

// Convert HH:MM to 12-hour format
function convertTo12HourFormat(timeString) {
  if (typeof timeString !== "string" || !timeString.includes(":"))
    return "Invalid Time";
  const [hours, minutes] = timeString.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return "Invalid Time";

  const period = hours >= 12 ? "PM" : "AM";
  const hourIn12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hourIn12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Store job counter
let jobCounters = {
  "Inner Bearing": 1,
  "CVT Tank": 1,
};

// Save to localStorage with structure
function saveToStorage(productName, scheduleData, startTime, endTime) {
  const key = productName === "CVT Tank" ? "cvtJobs" : "innerBearingJobs";

  const existingJobs = JSON.parse(localStorage.getItem(key)) || [];

  const formattedStart = convertTo12HourFormat(convertToTime(startTime));
  const formattedEnd = convertTo12HourFormat(convertToTime(endTime));

  const jobEntry = {
    name: `${productName} Job ${jobCounters[productName]++}`,
    workTime: `From ${formattedStart} to ${formattedEnd}`,
    value: scheduleData,
  };

  existingJobs.push(jobEntry);
  localStorage.setItem(key, JSON.stringify(existingJobs));
}

// Initialize machines
const machines = [
  new Machine("VTL"),
  new Machine("VMC 1"),
  new Machine("VMC 2"),
  new Machine("Universal Milling"),
  new Machine("Horizontal Milling"),
  new Machine("Lathe"),
  new Machine("Drilling"),
  new Machine("CNC Tapping"),
  new Machine("Dot Marking"),
  new Machine("Press Brake"),
  new Machine("Welding 1"),
  new Machine("Welding 2"),
  new Machine("Welding 3"),
  new Machine("Welding 4"),
  new Machine("Welding 5"),
  new Machine("Manual 1"),
  new Machine("Manual 2"),
  new Machine("Manual 3"),
  new Machine("Manual 4"),
  new Machine("Manual 5"),
  new Machine("Manual 6"),
];

// Products
const innerBearing = new Product("Inner Bearing", [
  { name: "Cutting", processTime: 30, machineNeeded: "VTL" },
  { name: "Slot Mill", processTime: 50, machineNeeded: "VMC 1" },
  { name: "Debour", processTime: 20, machineNeeded: "Manual 1" },
  { name: "Tapping", processTime: 12, machineNeeded: "CNC Tapping" },
  { name: "Marking", processTime: 3, machineNeeded: "Dot Marking" },
  {
    name: "Welding",
    processTime: 40,
    machineNeeded: ["Welding 1", "Welding 2", "Welding 3", "Welding 4"],
  },
]);

const cvtTank = new Product("CVT Tank", [
  { name: "Marking", processTime: 2, machineNeeded: "Dot Marking" },
  { name: "Bending", processTime: 24, machineNeeded: "Press Brake" },
  { name: "Setting", processTime: 20, machineNeeded: "Welding 3" },
  {
    name: "Full Weld",
    processTime: 40,
    machineNeeded: ["Welding 1", "Welding 2", "Welding 3", "Welding 4"],
  },
]);

let fullSchedule = [];
let globalCurrentTime = getCurrentTimeInMinutes();

// Add a job and update schedule
function addJob(productName, quantity) {
  let selectedProduct;

  if (productName === "Inner Bearing") selectedProduct = innerBearing;
  else if (productName === "CVT Tank") selectedProduct = cvtTank;

  if (!selectedProduct) return;

  const { schedule, totalTime } = selectedProduct.scheduleProcesses(
    machines,
    quantity,
    globalCurrentTime
  );

  fullSchedule = [...fullSchedule, ...schedule];
  saveToStorage(productName, schedule, globalCurrentTime, totalTime);
  globalCurrentTime = Math.max(globalCurrentTime, totalTime);
}

// Reset the scheduler
function resetScheduler() {
  fullSchedule = [];
  globalCurrentTime = getCurrentTimeInMinutes();
  machines.forEach((machine) => {
    machine.availableAt = globalCurrentTime;
  });

  // Reset job counters and localStorage (optional if you want to clear)
  jobCounters = { "Inner Bearing": 1, "CVT Tank": 1 };
  localStorage.removeItem("innerBearingJobs");
  localStorage.removeItem("cvtJobs");
}

// Get displayable schedule
function getScheduleTable() {
  return fullSchedule.map((task) => ({
    partNo: task.partNo,
    process: task.process,
    machine: task.machine,
    start: convertToTime(task.startTime),
    end: convertToTime(task.endTime),
  }));
}
