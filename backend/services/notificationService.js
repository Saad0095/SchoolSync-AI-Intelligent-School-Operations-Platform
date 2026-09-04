import Notification from "../models/Notification.js";
import logger from "../utils/logger.js";
import { io } from "../index.js";

/**
 * Send a notification to a specific user
 */
export const sendNotification = async (recipientId, type, title, message, link = null) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      type,
      title,
      message,
      link,
    });
    await notification.save();
    
    // Emit real-time socket event
    if (io) {
      io.to(`user:${recipientId}`).emit("notification:new", notification);
    }
    
    return notification;
  } catch (error) {
    logger.error(`Failed to send notification to ${recipientId}: ${error.message}`);
  }
};

/**
 * Send bulk notifications to multiple users
 */
export const sendBulkNotifications = async (recipientIds, type, title, message, link = null) => {
  try {
    const notifications = recipientIds.map(id => ({
      recipient: id,
      type,
      title,
      message,
      link,
    }));
    
    if (notifications.length > 0) {
      const inserted = await Notification.insertMany(notifications);
      
      // Emit real-time socket events for bulk notifications
      if (io) {
        inserted.forEach(notification => {
          io.to(`user:${notification.recipient}`).emit("notification:new", notification);
        });
      }
    }
  } catch (error) {
    logger.error(`Failed to send bulk notifications: ${error.message}`);
  }
};
