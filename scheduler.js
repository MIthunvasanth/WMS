// Machine class to handle scheduling
class Machine {
  constructor(name) {
    this.name = name;
    this.availableAt = new Date();
    this.processHistory = []; // Track process history for each machine
  }

  // Schedule the machine with the given process time
  schedule(processTime, current) {
    const start = new Date(Math.max(this.availableAt, current));
    const end = new Date(start.getTime() + processTime * 60000); // process time in minutes
    this.availableAt = end; // Update machine availability
    this.processHistory.push({
      processStart: start,
      processEnd: end,
      processTime: processTime,
    });

    return { machine: this.name, start, end };
  }

  // Get when the machine will be free
  getNextAvailableTime() {
    return this.availableAt;
  }
}

// Product class with process flows
class Product {
  constructor(name, processFlow) {
    this.name = name;
    this.processFlow = processFlow;
  }

  schedule(machines, quantity, startTime, dailyMinutes) {
    let results = [];
    let currentTime = new Date(startTime);

    for (let i = 0; i < quantity; i++) {
      let unitTime = new Date(currentTime);

      // Process each step for the product
      for (const process of this.processFlow) {
        const { name, processTime, machineNeeded } = process;
        const machinesNeeded = Array.isArray(machineNeeded)
          ? machineNeeded
          : [machineNeeded];

        for (const machineName of machinesNeeded) {
          const machine = machines.find((m) => m.name === machineName);

          if (!machine) continue;

          // Skip non-working times and Sundays
          while (
            isSunday(unitTime) ||
            !withinWorkingHours(unitTime, dailyMinutes, startTime)
          ) {
            unitTime = nextWorkingSlot(unitTime, dailyMinutes, startTime);
          }

          const { start, end } = machine.schedule(processTime, unitTime);
          results.push({
            partNo: this.name,
            process: name,
            machine: machine.name,
            start: convertToTimeFormat(start),
            end: convertToTimeFormat(end),
          });

          unitTime = new Date(end); // Move to next process time
        }
      }
    }

    return results;
  }
}

// Helper function to convert minutes to time format
function convertToTimeFormat(date) {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

// Helper function to check if the date is a Sunday
function isSunday(date) {
  return date.getDay() === 0; // Sunday = 0
}

// Check if the current time is within working hours
function withinWorkingHours(date, dailyMinutes, startTime) {
  const workStart = new Date(startTime);
  workStart.setHours(9, 0, 0, 0); // Assume workday starts at 9 AM
  const workEnd = new Date(workStart);
  workEnd.setHours(workStart.getHours() + dailyMinutes);

  return date >= workStart && date <= workEnd;
}

// Get the next available working slot
function nextWorkingSlot(current, dailyMinutes, startTime) {
  let nextSlot = new Date(current);
  nextSlot.setHours(nextSlot.getHours() + 1); // Skip 1 hour
  return nextSlot;
}

// Initialize the machines
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
  new Machine("Manual 1"),
  new Machine("Manual 2"),
  new Machine("Manual 3"),
  new Machine("Manual 4"),
  new Machine("Manual 5"),
  new Machine("Manual 6"),
];

// Define products
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

// Handle form submission
document
  .getElementById("schedulerForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const quantity = parseInt(document.getElementById("quantity").value);
    const product = document.getElementById("product").value;
    const workingHours = parseInt(
      document.getElementById("workingHours").value
    );

    if (!startDate || !endDate || isNaN(quantity)) {
      alert("Please fill in all fields correctly.");
      return;
    }

    let selectedProduct;

    if (product === "Inner Bearing") selectedProduct = innerBearing;
    else if (product === "CVT Tank") selectedProduct = cvtTank;

    const schedule = selectedProduct.schedule(
      machines,
      quantity,
      new Date(startDate),
      workingHours * 60 // Convert to minutes
    );

    displaySchedule(schedule);
    saveToLocalStorage(schedule);
  });

// Display the schedule in the table
function displaySchedule(schedule) {
  const scheduleTableBody = document.querySelector("#scheduleTable tbody");
  scheduleTableBody.innerHTML = "";

  schedule.forEach((task) => {
    const row = document.createElement("tr");
    row.innerHTML = ` 
      <td>${task.partNo}</td>
      <td>${task.process}</td>
      <td>${task.machine}</td>
      <td>${task.start}</td>
      <td>${task.end}</td>
    `;
    scheduleTableBody.appendChild(row);
  });

  document.getElementById("scheduleTable").style.display = "table";
}

// Save the schedule to localStorage
function saveToLocalStorage(schedule) {
  localStorage.setItem("schedule", JSON.stringify(schedule));
}
