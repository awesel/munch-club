'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getMonday, formatDateKey } from '@/lib/api'; // Import helpers

// --- Configuration --- 
const HOURS_START = 8; // 8 AM
const HOURS_END = 18; // 6 PM (exclusive, so last slot is 17:30)
const TIME_SLOT_MINUTES = 30;
const DAYS_IN_WEEK = 7;
// ---------------------

interface TimeSlot {
  time: string; // "HH:MM"
  dateTime: Date;
}

interface DayColumn {
  date: Date;
  dateKey: string; // YYYY-MM-DD
}

interface AvailabilityGridProps {
  initialAvailability: Record<string, string[]>; // { 'YYYY-MM-DD': ['09:00', '09:30'] }
  weekDate: Date; // Any date within the target week
  onAvailabilityChange: (newAvailability: Record<string, string[]>) => void;
  isSaving: boolean;
}

const AvailabilityGrid: React.FC<AvailabilityGridProps> = ({ 
  initialAvailability, 
  weekDate, 
  onAvailabilityChange, 
  isSaving 
}) => {
  const [selectedSlots, setSelectedSlots] = useState<Record<string, string[]>>(initialAvailability);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect' | null>(null);

  // Update internal state if initialAvailability changes (e.g., after fetching)
  useEffect(() => {
    setSelectedSlots(initialAvailability);
  }, [initialAvailability]);

  const { days, timeSlots } = useMemo(() => {
    const monday = getMonday(weekDate);
    const currentDays: DayColumn[] = [];
    for (let i = 0; i < DAYS_IN_WEEK; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      currentDays.push({ date: dayDate, dateKey: formatDateKey(dayDate) });
    }

    const slots: TimeSlot[] = [];
    const startTime = new Date(monday);
    startTime.setHours(HOURS_START, 0, 0, 0);
    const endTime = new Date(monday);
    endTime.setHours(HOURS_END, 0, 0, 0);

    let currentTime = new Date(startTime);
    while (currentTime < endTime) {
      const hours = currentTime.getHours().toString().padStart(2, '0');
      const minutes = currentTime.getMinutes().toString().padStart(2, '0');
      slots.push({ 
        time: `${hours}:${minutes}`, 
        dateTime: new Date(currentTime) // Store full date for potential future use
      });
      currentTime.setMinutes(currentTime.getMinutes() + TIME_SLOT_MINUTES);
    }
    return { days: currentDays, timeSlots: slots };
  }, [weekDate]);

  const handleSlotInteraction = (dayKey: string, time: string, isInitialClick: boolean = false) => {
    const currentDaySlots = selectedSlots[dayKey] || [];
    const isSelected = currentDaySlots.includes(time);
    let newDaySlots: string[];
    let currentDragMode = dragMode;

    if (isInitialClick) {
      currentDragMode = isSelected ? 'deselect' : 'select';
      setDragMode(currentDragMode);
    }

    if (currentDragMode === 'select') {
      if (!isSelected) {
        newDaySlots = [...currentDaySlots, time].sort();
      } else {
        newDaySlots = currentDaySlots;
      }
    } else if (currentDragMode === 'deselect') {
      if (isSelected) {
        newDaySlots = currentDaySlots.filter(t => t !== time);
      } else {
        newDaySlots = currentDaySlots;
      }
    } else {
        newDaySlots = currentDaySlots; // Should not happen if logic is correct
    }
    
    const newAvailability = { ...selectedSlots, [dayKey]: newDaySlots };
    setSelectedSlots(newAvailability);
    onAvailabilityChange(newAvailability); // Notify parent immediately
  };

  const handleMouseDown = (dayKey: string, time: string) => {
    if (isSaving) return;
    setIsDragging(true);
    handleSlotInteraction(dayKey, time, true); // true indicates initial click
  };

  const handleMouseEnter = (dayKey: string, time: string) => {
    if (isDragging && !isSaving) {
      handleSlotInteraction(dayKey, time, false); // false indicates drag-over
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
        setIsDragging(false);
        setDragMode(null);
        // Final state already set by handleSlotInteraction, onAvailabilityChange already called
    }
  };
  
  // Add mouseup listener to the window to catch drags ending outside the grid
  useEffect(() => {
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, [isDragging]); // Re-add if isDragging changes

  const getSlotClasses = (dayKey: string, time: string): string => {
    const baseClass = "border border-gray-200 dark:border-gray-600 h-6 cursor-pointer select-none";
    const selectedClass = "bg-green-400 dark:bg-green-600";
    const deselectedClass = "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600";
    const savingClass = isSaving ? "opacity-50 cursor-not-allowed" : "";

    const isSelected = (selectedSlots[dayKey] || []).includes(time);
    return `${baseClass} ${isSelected ? selectedClass : deselectedClass} ${savingClass}`;
  }

  return (
    <div className="overflow-x-auto pb-4" onMouseLeave={handleMouseUp}> {/* Handle mouse leaving grid area */} 
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-500 table-fixed">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="sticky left-0 z-10 bg-gray-100 dark:bg-gray-800 w-24 px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-300 dark:border-gray-500">Time</th>
              {days.map((day) => (
                <th key={day.dateKey} className="w-28 px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div>{day.date.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                  <div>{day.date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {timeSlots.map((slot) => (
              <tr key={slot.time}>
                <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 w-24 px-2 py-1 text-xs font-mono text-gray-500 dark:text-gray-400 border-r border-gray-300 dark:border-gray-500">{slot.time}</td>
                {days.map((day) => (
                  <td
                    key={`${day.dateKey}-${slot.time}`}
                    className={getSlotClasses(day.dateKey, slot.time)}
                    onMouseDown={() => handleMouseDown(day.dateKey, slot.time)}
                    onMouseEnter={() => handleMouseEnter(day.dateKey, slot.time)}
                    // No onMouseUp needed here, handled globally
                  >
                    {/* Content inside cell if needed */}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AvailabilityGrid; 