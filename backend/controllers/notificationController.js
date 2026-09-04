import Notification from "../models/Notification.js";

export const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
      
    const unreadCount = await Notification.countDocuments({ 
      recipient: req.user._id, 
      isRead: false 
    });

    res.status(200).json({ data: notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.findOneAndUpdate(
      { _id: id, recipient: req.user._id },
      { isRead: true }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
