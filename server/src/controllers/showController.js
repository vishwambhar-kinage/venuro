import { dataStore } from '../models/dataStore.js';
import { lockSeat, unlockSeat, getSeatLockStatuses, RedisLockService } from '../services/redisLockService.js';

export const getShowsForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const shows = dataStore.getShowsForEvent(eventId);

    res.json({
      success: true,
      shows
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getShowSeatMap = async (req, res) => {
  try {
    const { showId } = req.params;
    const show = dataStore.findShowById(showId);

    if (!show) {
      return res.status(404).json({ success: false, message: 'Showtime not found' });
    }

    const event = dataStore.findEventById(show.eventId);

    // Retrieve active Redis locks
    const activeLocks = await RedisLockService.getActiveLocksForShow(showId);

    // Merge locks into dynamic seat grid
    const currentUserId = req.user ? req.user._id : null;
    const dynamicGrid = show.seatGrid.map(row =>
      row.map(seat => {
        const lockInfo = activeLocks[seat.id];
        let dynamicStatus = seat.status; // 'available' | 'booked'

        if (seat.status !== 'booked' && lockInfo) {
          dynamicStatus = 'locked';
        }

        return {
          ...seat,
          status: dynamicStatus,
          isLockedByMe: lockInfo && lockInfo.userId === currentUserId,
          lockTtl: lockInfo ? lockInfo.remainingSeconds : 0
        };
      })
    );

    res.json({
      success: true,
      show: {
        ...show,
        seatGrid: dynamicGrid
      },
      event,
      activeLocks
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const createShow = async (req, res) => {
  try {
    const { eventId, screenName, date, startTime, endTime, pricingTiers } = req.body;

    if (!eventId || !date || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide eventId, date, and startTime.'
      });
    }

    const event = dataStore.findEventById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const newShow = dataStore.createShow({
      eventId,
      screenName: screenName || 'Screen 1 - 4K Laser IMAX',
      date,
      startTime,
      endTime: endTime || '22:30',
      pricingTiers
    });

    res.status(201).json({
      success: true,
      message: 'Showtime created successfully!',
      show: newShow
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
