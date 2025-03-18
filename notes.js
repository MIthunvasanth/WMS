class Machine {
  constructor(name) {
    this.name = name;
    this.availableAt = 540; // Start at 9:00 AM (540 minutes since midnight)
  }

  // Method to schedule a task on the machine
  scheduleTask(processTime, currentTime) {
    const startTime = Math.max(currentTime, this.availableAt); // Start when the machine is free or the current time
    const endTime = startTime + processTime;
    this.availableAt = endTime; // Update when the machine will be free next
    return { machine: this.name, startTime, endTime };
  }
}

class Product {
  constructor(partNo, processes) {
    this.partNo = partNo;
    this.processes = processes; // Array of processes
  }

  // Method to schedule all processes for the product
  scheduleProcesses(machines, quantity, currentTime = 540) {
    const schedule = [];
    let totalTime = 0;

    // For each process, repeat it based on the quantity of products
    for (const process of this.processes) {
      const { name, processTime, machineNeeded } = process;

      // If the process needs a specific machine (like welding), find the available machine from the pool
      let machine;
      if (Array.isArray(machineNeeded)) {
        // If there are multiple machines available (like welding), find the first available one
        machine = this.findAvailableMachine(
          machines,
          machineNeeded,
          currentTime
        );
      } else {
        // Otherwise, just find the specific machine
        machine = machines.find((m) => m.name === machineNeeded);
      }

      // Repeat the process for the required quantity, sequentially
      for (let i = 0; i < quantity; i++) {
        if (machine) {
          const task = machine.scheduleTask(processTime, currentTime);
          schedule.push({ partNo: this.partNo, process: name, ...task });
          currentTime = task.endTime; // Update current time after each process
          totalTime = task.endTime; // Keep track of total time
        }
      }
    }
    return { schedule, totalTime };
  }

  // Find the first available machine from the pool of machines assigned to the process
  findAvailableMachine(machines, machineNames, currentTime) {
    // Find the machines that match the provided names (array of possible machines)
    const availableMachines = machines.filter((m) =>
      machineNames.includes(m.name)
    );

    // Sort by the earliest available machine and return the first one
    availableMachines.sort((a, b) => a.availableAt - b.availableAt);
    return availableMachines.length > 0 ? availableMachines[0] : null;
  }
}

// Define the new machine list
const machines = [
  new Machine('VTL'),
  new Machine('VMC 1'),
  new Machine('VMC 2'),
  new Machine('Universal Milling'),
  new Machine('Horizontal Milling'),
  new Machine('Lathe'),
  new Machine('Drilling'),
  new Machine('CNC Tapping'),
  new Machine('Dot Marking'),
  new Machine('Press Brake'),
  new Machine('Welding 1'),
  new Machine('Welding 2'),
  new Machine('Welding 3'),
  new Machine('Welding 4'),
  new Machine('Welding 5'),
  new Machine('Manual 1'),
  new Machine('Manual 2'),
  new Machine('Manual 3'),
  new Machine('Manual 4'),
  new Machine('Manual 5'),
  new Machine('Manual 6'),
];

// Example product definition
const innerBearing = new Product('Inner Bearing', [
  { name: 'Cutting', processTime: 30, machineNeeded: 'VTL' },
  { name: 'Slot Mill', processTime: 50, machineNeeded: 'VMC 1' },
  { name: 'Debour', processTime: 20, machineNeeded: 'Manual 1' },
  { name: 'Tapping', processTime: 12, machineNeeded: 'CNC Tapping' },
  { name: 'Marking', processTime: 3, machineNeeded: 'Dot Marking' },
  {
    name: 'Welding',
    processTime: 40,
    machineNeeded: ['Welding 1', 'Welding 2', 'Welding 3', 'Welding 4'],
  },
]);

const cvtTank = new Product('CVT Tank', [
  { name: 'Marking', processTime: 2, machineNeeded: 'Dot Marking' },
  { name: 'Bending', processTime: 24, machineNeeded: 'Press Brake' },
  { name: 'Setting', processTime: 20, machineNeeded: 'Welding 3' },
  {
    name: 'Full Weld',
    processTime: 40,
    machineNeeded: ['Welding 1', 'Welding 2', 'Welding 3', 'Welding 4'],
  },
]);

// Input: Product and quantity (dynamically received as an object)
const productInput = { 'Inner Bearing': 5, cvtTank: 4 };

// Function to schedule products based on input
function scheduleProducts(productInput) {
  let fullSchedule = [];
  let totalTime = 0;
  let currentTime = 540; // Start time at 9:00 AM

  // Iterate through each product to schedule it
  for (const [productName, quantity] of Object.entries(productInput)) {
    let selectedProduct;

    if (productName === 'Inner Bearing') {
      selectedProduct = innerBearing;
    } else if (productName === 'cvtTank') {
      selectedProduct = cvtTank;
    }

    if (selectedProduct) {
      const { schedule, totalTime: productTotalTime } =
        selectedProduct.scheduleProcesses(machines, quantity, currentTime);
      fullSchedule = [...fullSchedule, ...schedule];
      totalTime = Math.max(totalTime, productTotalTime); // Track the overall time
    }
  }

  // Sort all tasks by their start time to create the final schedule
  fullSchedule.sort((a, b) => a.startTime - b.startTime);

  return { fullSchedule, totalTime };
}

// Convert total time to actual hours and minutes from 9:00 AM
const convertToTime = (timeInMinutes) => {
  const hours = Math.floor(timeInMinutes / 60);
  const minutes = timeInMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
};

// Get the full schedule based on input
const { fullSchedule, totalTime } = scheduleProducts(productInput);

// Display the full schedule with total times in actual time
console.log('Full Schedule:');
fullSchedule.forEach((task) => {
  console.log(
    `Product: ${task.partNo}, Process: ${task.process}, Machine: ${
      task.machine
    }, Start Time: ${convertToTime(
      task.startTime
    )} AM, End Time: ${convertToTime(task.endTime)} AM`
  );
});

// Output total time to complete the product batch (in hours and minutes)
console.log('\nTotal Time for All Products:');
console.log(`Total Time: ${convertToTime(totalTime)} AM`);
