import cron from "node-cron";
import {
  checkLowAttendanceAndNotify,
  generateMonthlyAttendanceReports,
} from "../services/reportService.js";
import logger from "../utils/logger.js";

cron.schedule(
  "0 9 1 * *",
  async () => {
    logger.info("Running monthly attendance report cron job...");
    try {
      await generateMonthlyAttendanceReports();
      logger.info("✅ Monthly attendance reports generated and emailed.");
    } catch (err) {
      logger.error("❌ Error in cron job:", err);
    }
  },
  {
    timezone: "Asia/Karachi",
  }
);

cron.schedule(
  "0 12 * * 6",
  async () => {
    logger.info("Running weekly low attendance check...");
    try {
      await checkLowAttendanceAndNotify();
      logger.info("✅ Low attendance alerts sent.");
    } catch (err) {
      logger.error("Error in low attendance cron:", err);
    }
  },
  {
    timezone: "Asia/Karachi",
  }
);
