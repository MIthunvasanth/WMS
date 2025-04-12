const { contextBridge } = require("electron");
const { addJob, getSchedule } = require("./scheduler");

contextBridge.exposeInMainWorld("schedulerAPI", {
  addJob,
  getSchedule,
});
