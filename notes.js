// Utility to auto-expand machine group names like 'VMC' to ['VMC 1', 'VMC 2']
const machineGroups = {
  VMC: ['VMC 1', 'VMC 2'],
  Welding: ['Welding 1', 'Welding 2', 'Welding 3', 'Welding 4', 'Welding 5'],
  Manual: [
    'Manual 1',
    'Manual 2',
    'Manual 3',
    'Manual 4',
    'Manual 5',
    'Manual 6',
  ],
};

class Machine {
  constructor(name) {
    this.name = name;
    this.availableAt = 540; // Start at 9:00 AM (540 minutes)
    this.runTime = 0; // Track how long the machine is used
  }

  scheduleTask(processTime, currentTime) {
    const startTime = Math.max(currentTime, this.availableAt);
    const endTime = startTime + processTime;
    this.availableAt = endTime;
    this.runTime += processTime;
    return { machine: this.name, startTime, endTime };
  }
}

class Product {
  constructor(partNo, processes) {
    this.partNo = partNo;
    this.processes = processes;
  }

  scheduleProcesses(machines, quantity, currentTime = 540) {
    const schedule = [];
    let totalTime = 0;

    for (const process of this.processes) {
      const { name, processTime, machineNeeded } = process;

      let machineOptions = Array.isArray(machineNeeded)
        ? machineNeeded
        : machineGroups[machineNeeded] || [machineNeeded];

      for (let i = 0; i < quantity; i++) {
        const machine = this.findAvailableMachine(machines, machineOptions);
        if (machine) {
          const task = machine.scheduleTask(processTime, currentTime);
          schedule.push({ partNo: this.partNo, process: name, ...task });
          currentTime = task.endTime;
          totalTime = Math.max(totalTime, task.endTime);
        }
      }
    }
    return { schedule, totalTime };
  }

  findAvailableMachine(machines, machineNames) {
    const availableMachines = machines.filter((m) =>
      machineNames.includes(m.name)
    );
    availableMachines.sort((a, b) => a.availableAt - b.availableAt);
    return availableMachines[0] || null;
  }
}

const machines = [
  'VTL',
  'VMC 1',
  'VMC 2',
  'Universal Milling',
  'Horizontal Milling',
  'Lathe',
  'Drilling',
  'CNC Tapping',
  'Dot Marking',
  'Press Brake',
  'Welding 1',
  'Welding 2',
  'Welding 3',
  'Welding 4',
  'Welding 5',
  'Manual 1',
  'Manual 2',
  'Manual 3',
  'Manual 4',
  'Manual 5',
  'Manual 6',
].map((name) => new Machine(name));

const productCatalog = {
  'Inner Bearing': new Product('Inner Bearing', [
    { name: 'Cutting', processTime: 30, machineNeeded: 'VTL' },
    { name: 'Slot Mill', processTime: 50, machineNeeded: 'VMC' },
    { name: 'Debour', processTime: 20, machineNeeded: 'Manual' },
    { name: 'Tapping', processTime: 12, machineNeeded: 'CNC Tapping' },
    { name: 'Marking', processTime: 3, machineNeeded: 'Dot Marking' },
    { name: 'Welding', processTime: 40, machineNeeded: 'Welding' },
  ]),
  'CVT Tank': new Product('CVT Tank', [
    { name: 'Marking', processTime: 2, machineNeeded: 'Dot Marking' },
    { name: 'Bending', processTime: 24, machineNeeded: 'Press Brake' },
    { name: 'Setting', processTime: 20, machineNeeded: 'Welding' },
    { name: 'Full Weld', processTime: 40, machineNeeded: 'Welding' },
  ]),
};

function scheduleProducts(productInput, dueTime = 1020) {
  // Default due time 5 PM
  let fullSchedule = [];
  let maxEndTime = 0;

  for (const [productName, { quantity, dueTime: productDue }] of Object.entries(
    productInput
  )) {
    const product = productCatalog[productName];
    if (!product) continue;

    const { schedule, totalTime } = product.scheduleProcesses(
      machines,
      quantity
    );
    fullSchedule.push(...schedule);
    maxEndTime = Math.max(maxEndTime, totalTime);

    if (totalTime > (productDue || dueTime)) {
      console.log(`${productName} CANNOT be completed before due time.`);
    } else {
      console.log(`${productName} can be completed on time.`);
    }
  }

  fullSchedule.sort((a, b) => a.startTime - b.startTime);

  return {
    fullSchedule,
    machineUsage: machines.map((m) => ({
      machine: m.name,
      runTime: m.runTime,
    })),
    totalEndTime: maxEndTime,
  };
}

const convertToTime = (time) => {
  const h = Math.floor(time / 60);
  const m = time % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

// Example input
const input = {
  'Inner Bearing': { quantity: 5, dueTime: 1020 }, // 5 PM
  'CVT Tank': { quantity: 4, dueTime: 1020 },
};

const result = scheduleProducts(input);

console.log('\nFull Schedule:');
result.fullSchedule.forEach((task) => {
  console.log(
    `Product: ${task.partNo}, Process: ${task.process}, Machine: ${task.machine}, ` +
      `Start: ${convertToTime(task.startTime)}, End: ${convertToTime(
        task.endTime
      )}`
  );
});

console.log('\nMachine Usage:');
result.machineUsage.forEach((m) => {
  if (m.runTime > 0) {
    console.log(`${m.machine}: ${m.runTime} mins`);
  }
});

console.log(`\nTotal Time to Finish: ${convertToTime(result.totalEndTime)}`);
