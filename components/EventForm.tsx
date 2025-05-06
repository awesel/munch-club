'use client';

import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import Button from './Button';
import Spinner from './Spinner';

interface EventFormProps {
  onSubmit: (formData: { name: string; start: Date; end: Date; capacity: number }) => Promise<void>;
  isSubmitting: boolean;
}

interface FormErrors {
  name?: string;
  start?: string;
  end?: string;
  capacity?: string;
  general?: string;
}

// Helper to format Date to datetime-local string
const formatDateToDateTimeLocal = (date: Date | null): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const EventForm: React.FC<EventFormProps> = ({ onSubmit, isSubmitting }) => {
  const [name, setName] = useState('');
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [capacity, setCapacity] = useState<number | ''>('');
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required.';
    if (!start) newErrors.start = 'Start date and time are required.';
    if (!end) newErrors.end = 'End date and time are required.';
    if (start && end && end <= start) newErrors.end = 'End time must be after start time.';
    if (capacity === '') newErrors.capacity = 'Capacity is required.';
    else if (Number(capacity) < 1) newErrors.capacity = 'Capacity must be at least 1.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting || !start || !end || capacity === '') return;

    setErrors({}); // Clear previous errors

    try {
      await onSubmit({ 
        name: name.trim(), 
        start: start, // Pass Date objects
        end: end, 
        capacity: Number(capacity) 
      });
      // Reset form on success could be done here or handled by parent
    } catch (error) {
      console.error("Form submission error:", error);
      setErrors({ general: error instanceof Error ? error.message : 'An unexpected error occurred.' });
    }
  };

  const handleDateTimeChange = (setter: React.Dispatch<React.SetStateAction<Date | null>>) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value) {
        setter(new Date(e.target.value));
      } else {
        setter(null);
      }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <p className="text-red-600 dark:text-red-400 text-sm bg-red-100 dark:bg-red-900/30 p-2 rounded">{errors.general}</p>
      )}
      
      <div>
        <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Name</label>
        <input
          type="text"
          id="eventName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500'} dark:bg-gray-700 dark:text-white`}
          aria-describedby={errors.name ? "name-error" : undefined}
          aria-invalid={!!errors.name}
          disabled={isSubmitting}
        />
        {errors.name && <p id="name-error" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="eventStart" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
        <input
          type="datetime-local"
          id="eventStart"
          value={formatDateToDateTimeLocal(start)}
          onChange={handleDateTimeChange(setStart)}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${errors.start ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500'} dark:bg-gray-700 dark:text-white`}
          aria-describedby={errors.start ? "start-error" : undefined}
          aria-invalid={!!errors.start}
          disabled={isSubmitting}
        />
        {errors.start && <p id="start-error" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.start}</p>}
      </div>

      <div>
        <label htmlFor="eventEnd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
        <input
          type="datetime-local"
          id="eventEnd"
          value={formatDateToDateTimeLocal(end)}
          onChange={handleDateTimeChange(setEnd)}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${errors.end ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500'} dark:bg-gray-700 dark:text-white`}
          aria-describedby={errors.end ? "end-error" : undefined}
          aria-invalid={!!errors.end}
          disabled={isSubmitting}
        />
        {errors.end && <p id="end-error" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.end}</p>}
      </div>

      <div>
        <label htmlFor="eventCapacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Capacity</label>
        <input
          type="number"
          id="eventCapacity"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
          min="1"
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${errors.capacity ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500'} dark:bg-gray-700 dark:text-white`}
          aria-describedby={errors.capacity ? "capacity-error" : undefined}
          aria-invalid={!!errors.capacity}
          disabled={isSubmitting}
        />
        {errors.capacity && <p id="capacity-error" className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.capacity}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting} aria-label="Create new event">
        {isSubmitting ? <Spinner /> : 'Create Event'}
      </Button>
    </form>
  );
};

export default EventForm;
